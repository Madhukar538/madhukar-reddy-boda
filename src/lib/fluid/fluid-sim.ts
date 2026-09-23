/**
 * Real-time 2D fluid simulation on the GPU (WebGL2), following Jos Stam's
 * "stable fluids": each frame computes curl → vorticity confinement →
 * divergence → pressure (Jacobi) → gradient subtraction → advection of
 * velocity and dye. Dye is rendered with premultiplied alpha so the page
 * background shows through.
 */

const VERT = `#version 300 es
precision highp float;
in vec2 aPosition;
uniform vec2 texelSize;
out vec2 vUv, vL, vR, vT, vB;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const head = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv, vL, vR, vT, vB;
out vec4 fragColor;
`;

const FRAG = {
  clear: `${head}
uniform sampler2D uTexture; uniform float value;
void main() { fragColor = value * texture(uTexture, vUv); }`,

  splat: `${head}
uniform sampler2D uTarget; uniform float aspectRatio; uniform vec3 color; uniform vec2 point; uniform float radius;
void main() {
  vec2 p = vUv - point;
  p.x *= aspectRatio;
  vec3 splat = exp(-dot(p, p) / radius) * color;
  fragColor = vec4(texture(uTarget, vUv).xyz + splat, 1.0);
}`,

  advection: `${head}
uniform sampler2D uVelocity, uSource; uniform vec2 velTexel; uniform float dt, dissipation;
void main() {
  vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * velTexel;
  fragColor = texture(uSource, coord) / (1.0 + dissipation * dt);
}`,

  divergence: `${head}
uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity, vL).x, R = texture(uVelocity, vR).x;
  float T = texture(uVelocity, vT).y, B = texture(uVelocity, vB).y;
  vec2 C = texture(uVelocity, vUv).xy;
  if (vL.x < 0.0) L = -C.x;
  if (vR.x > 1.0) R = -C.x;
  if (vT.y > 1.0) T = -C.y;
  if (vB.y < 0.0) B = -C.y;
  fragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`,

  curl: `${head}
uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity, vL).y, R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x, B = texture(uVelocity, vB).x;
  fragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}`,

  vorticity: `${head}
uniform sampler2D uVelocity, uCurl; uniform float curl, dt;
void main() {
  float L = texture(uCurl, vL).x, R = texture(uCurl, vR).x;
  float T = texture(uCurl, vT).x, B = texture(uCurl, vB).x;
  float C = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= curl * C;
  force.y *= -1.0;
  vec2 vel = texture(uVelocity, vUv).xy + force * dt;
  fragColor = vec4(clamp(vel, -1000.0, 1000.0), 0.0, 1.0);
}`,

  pressure: `${head}
uniform sampler2D uPressure, uDivergence;
void main() {
  float L = texture(uPressure, vL).x, R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x, B = texture(uPressure, vB).x;
  float div = texture(uDivergence, vUv).x;
  fragColor = vec4((L + R + B + T - div) * 0.25, 0.0, 0.0, 1.0);
}`,

  gradient: `${head}
uniform sampler2D uPressure, uVelocity;
void main() {
  float L = texture(uPressure, vL).x, R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x, B = texture(uPressure, vB).x;
  vec2 vel = texture(uVelocity, vUv).xy - vec2(R - L, T - B);
  fragColor = vec4(vel, 0.0, 1.0);
}`,

  display: `${head}
uniform sampler2D uTexture; uniform float intensity;
void main() {
  vec3 c = clamp(texture(uTexture, vUv).rgb * intensity, 0.0, 1.0);
  float a = max(c.r, max(c.g, c.b));
  fragColor = vec4(c, a);   // premultiplied: rgb <= a
}`,
};

type ProgramName = keyof typeof FRAG;

type Program = { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> };

type FBO = { texture: WebGLTexture; fbo: WebGLFramebuffer; width: number; height: number; texel: [number, number] };

type DoubleFBO = { read: FBO; write: FBO; swap: () => void; width: number; height: number; texel: [number, number] };

export type FluidConfig = {
  simResolution: number;
  dyeResolution: number;
  pressureIterations: number;
  curl: number;
  velocityDissipation: number;
  dyeDissipation: number;
  splatRadius: number;
  splatForce: number;
  intensity: number;
};

export const DEFAULT_FLUID: FluidConfig = {
  simResolution: 128,
  dyeResolution: 720,
  pressureIterations: 20,
  curl: 22,
  velocityDissipation: 0.25,
  dyeDissipation: 0.9,
  splatRadius: 0.22,
  splatForce: 5200,
  intensity: 1,
};

export class FluidSim {
  private gl: WebGL2RenderingContext;
  private programs = {} as Record<ProgramName, Program>;
  private velocity!: DoubleFBO;
  private dye!: DoubleFBO;
  private pressure!: DoubleFBO;
  private divergence!: FBO;
  private curlFbo!: FBO;
  private vao: WebGLVertexArrayObject;
  private targets: FBO[] = [];

  /** Returns null when the device can't run the simulation (caller falls back). */
  static create(canvas: HTMLCanvasElement, config: FluidConfig) {
    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
    if (!gl) return null;
    // Rendering into half-float textures needs this extension.
    if (!gl.getExtension('EXT_color_buffer_float') && !gl.getExtension('EXT_color_buffer_half_float')) return null;
    try {
      return new FluidSim(gl, canvas, config);
    } catch {
      return null;
    }
  }

  private constructor(gl: WebGL2RenderingContext, private canvas: HTMLCanvasElement, public config: FluidConfig) {
    this.gl = gl;
    const vs = this.compile(gl.VERTEX_SHADER, VERT);
    (Object.keys(FRAG) as ProgramName[]).forEach((name) => {
      this.programs[name] = this.link(vs, this.compile(gl.FRAGMENT_SHADER, FRAG[name]));
    });

    // Full-screen quad.
    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    this.allocate();
    // Verify float framebuffers actually work on this device.
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.velocity.read.fbo);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('fbo');
  }

  private compile(type: number, source: string) {
    const gl = this.gl;
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? 'shader');
    return shader;
  }

  private link(vs: WebGLShader, fs: WebGLShader): Program {
    const gl = this.gl;
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.bindAttribLocation(program, 0, 'aPosition');
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? 'link');
    const uniforms: Program['uniforms'] = {};
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i++) {
      const name = gl.getActiveUniform(program, i)!.name;
      uniforms[name] = gl.getUniformLocation(program, name);
    }
    return { program, uniforms };
  }

  private resolution(base: number) {
    const aspect = this.canvas.width / this.canvas.height || 1;
    const min = Math.round(base);
    const max = Math.round(base * (aspect < 1 ? 1 / aspect : aspect));
    return aspect >= 1 ? { w: max, h: min } : { w: min, h: max };
  }

  private fbo(w: number, h: number, filter: number): FBO {
    const gl = this.gl;
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const target: FBO = { texture, fbo, width: w, height: h, texel: [1 / w, 1 / h] };
    this.targets.push(target);
    return target;
  }

  private double(w: number, h: number, filter: number): DoubleFBO {
    const d = {
      read: this.fbo(w, h, filter),
      write: this.fbo(w, h, filter),
      width: w,
      height: h,
      texel: [1 / w, 1 / h] as [number, number],
      swap() {
        const t = d.read;
        d.read = d.write;
        d.write = t;
      },
    };
    return d;
  }

  private allocate() {
    const gl = this.gl;
    // Free the previous set (on resize) before allocating new targets.
    for (const t of this.targets) {
      gl.deleteTexture(t.texture);
      gl.deleteFramebuffer(t.fbo);
    }
    this.targets = [];
    const sim = this.resolution(this.config.simResolution);
    const dye = this.resolution(this.config.dyeResolution);
    this.velocity = this.double(sim.w, sim.h, gl.LINEAR);
    this.dye = this.double(dye.w, dye.h, gl.LINEAR);
    this.pressure = this.double(sim.w, sim.h, gl.NEAREST);
    this.divergence = this.fbo(sim.w, sim.h, gl.NEAREST);
    this.curlFbo = this.fbo(sim.w, sim.h, gl.NEAREST);
  }

  /** Call after the canvas size changes. */
  resize() {
    this.allocate();
  }

  private use(name: ProgramName, texel: [number, number]) {
    const p = this.programs[name];
    this.gl.useProgram(p.program);
    this.gl.uniform2f(p.uniforms.texelSize, texel[0], texel[1]);
    return p.uniforms;
  }

  private bindTex(unit: number, tex: WebGLTexture, loc: WebGLUniformLocation | null) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(loc, unit);
  }

  private blit(target: FBO | null) {
    const gl = this.gl;
    gl.bindVertexArray(this.vao);
    if (target) {
      gl.viewport(0, 0, target.width, target.height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    } else {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }

  /** Inject velocity and dye at (x, y) in 0..1 UV space (y up). */
  splat(x: number, y: number, dx: number, dy: number, color: [number, number, number]) {
    const gl = this.gl;
    const aspect = this.canvas.width / this.canvas.height;
    const radius = (this.config.splatRadius / 100) * (aspect > 1 ? aspect : 1);

    let u = this.use('splat', this.velocity.texel);
    this.bindTex(0, this.velocity.read.texture, u.uTarget);
    gl.uniform1f(u.aspectRatio, aspect);
    gl.uniform2f(u.point, x, y);
    gl.uniform3f(u.color, dx, dy, 0);
    gl.uniform1f(u.radius, radius);
    this.blit(this.velocity.write);
    this.velocity.swap();

    u = this.use('splat', this.dye.texel);
    this.bindTex(0, this.dye.read.texture, u.uTarget);
    gl.uniform1f(u.aspectRatio, aspect);
    gl.uniform2f(u.point, x, y);
    gl.uniform3f(u.color, color[0], color[1], color[2]);
    gl.uniform1f(u.radius, radius);
    this.blit(this.dye.write);
    this.dye.swap();
  }

  step(dt: number) {
    const gl = this.gl;
    const { config: c, velocity: vel } = this;
    gl.disable(gl.BLEND);

    let u = this.use('curl', vel.texel);
    this.bindTex(0, vel.read.texture, u.uVelocity);
    this.blit(this.curlFbo);

    u = this.use('vorticity', vel.texel);
    this.bindTex(0, vel.read.texture, u.uVelocity);
    this.bindTex(1, this.curlFbo.texture, u.uCurl);
    gl.uniform1f(u.curl, c.curl);
    gl.uniform1f(u.dt, dt);
    this.blit(vel.write);
    vel.swap();

    u = this.use('divergence', vel.texel);
    this.bindTex(0, vel.read.texture, u.uVelocity);
    this.blit(this.divergence);

    u = this.use('clear', this.pressure.texel);
    this.bindTex(0, this.pressure.read.texture, u.uTexture);
    gl.uniform1f(u.value, 0.8);
    this.blit(this.pressure.write);
    this.pressure.swap();

    u = this.use('pressure', vel.texel);
    this.bindTex(1, this.divergence.texture, u.uDivergence);
    for (let i = 0; i < c.pressureIterations; i++) {
      this.bindTex(0, this.pressure.read.texture, u.uPressure);
      this.blit(this.pressure.write);
      this.pressure.swap();
    }

    u = this.use('gradient', vel.texel);
    this.bindTex(0, this.pressure.read.texture, u.uPressure);
    this.bindTex(1, vel.read.texture, u.uVelocity);
    this.blit(vel.write);
    vel.swap();

    u = this.use('advection', vel.texel);
    gl.uniform2f(u.velTexel, vel.texel[0], vel.texel[1]);
    this.bindTex(0, vel.read.texture, u.uVelocity);
    this.bindTex(1, vel.read.texture, u.uSource);
    gl.uniform1f(u.dt, dt);
    gl.uniform1f(u.dissipation, c.velocityDissipation);
    this.blit(vel.write);
    vel.swap();

    u = this.use('advection', this.dye.texel);
    gl.uniform2f(u.velTexel, vel.texel[0], vel.texel[1]);
    this.bindTex(0, vel.read.texture, u.uVelocity);
    this.bindTex(1, this.dye.read.texture, u.uSource);
    gl.uniform1f(u.dt, dt);
    gl.uniform1f(u.dissipation, c.dyeDissipation);
    this.blit(this.dye.write);
    this.dye.swap();
  }

  render() {
    const gl = this.gl;
    const u = this.use('display', [1 / gl.drawingBufferWidth, 1 / gl.drawingBufferHeight]);
    this.bindTex(0, this.dye.read.texture, u.uTexture);
    gl.uniform1f(u.intensity, this.config.intensity);
    gl.clearColor(0, 0, 0, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clear(gl.COLOR_BUFFER_BIT);
    this.blit(null);
  }

  dispose() {
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}
