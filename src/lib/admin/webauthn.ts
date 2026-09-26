/**
 * WebAuthn glue: turns the API's JSON options (base64url strings) into what
 * navigator.credentials expects, and credentials back into the JSON the API
 * verifies. Nothing secret passes through here; private keys never leave
 * the authenticator.
 */

const toBuffer = (value: string) => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4);
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)).buffer;
};

const toBase64Url = (buffer: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

// The server may send nulls for unset options; browsers reject null enum values.
function withoutNulls<T>(value: T): T {
  if (Array.isArray(value)) return value.map(withoutNulls) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).filter(([, v]) => v !== null && v !== undefined).map(([k, v]) => [k, withoutNulls(v)])
    ) as T;
  }
  return value;
}

type Descriptor = { id: string; type: 'public-key'; transports?: AuthenticatorTransport[] };
const descriptors = (list: unknown) => ((list as Descriptor[] | undefined) ?? []).map((d) => ({ ...d, id: toBuffer(d.id) }));

const KNOWN_TRANSPORTS = new Set(['usb', 'nfc', 'ble', 'smart-card', 'hybrid', 'internal']);

export const isPasskeySupported = () => typeof window !== 'undefined' && 'PublicKeyCredential' in window && !!navigator.credentials;

export async function createPasskey(options: Record<string, unknown>) {
  const json = withoutNulls(options) as Record<string, unknown> & { challenge: string; user: { id: string } };
  const publicKey = {
    ...json,
    challenge: toBuffer(json.challenge),
    user: { ...json.user, id: toBuffer(json.user.id) },
    excludeCredentials: descriptors(json.excludeCredentials),
  } as unknown as PublicKeyCredentialCreationOptions;

  const credential = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential | null;
  if (!credential) throw new Error('No passkey was created.');
  const response = credential.response as AuthenticatorAttestationResponse;
  return {
    id: credential.id,
    rawId: toBase64Url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: toBase64Url(response.clientDataJSON),
      attestationObject: toBase64Url(response.attestationObject),
      transports: (response.getTransports?.() ?? []).filter((t) => KNOWN_TRANSPORTS.has(t)),
    },
    clientExtensionResults: credential.getClientExtensionResults(),
  };
}

/**
 * `fromPhone` asks the browser to go straight to "use a phone" (a QR code to
 * scan with the phone holding the passkey) instead of the computer's own
 * options. Browsers that don't know the hint ignore it and show their usual picker.
 */
export async function getPasskey(options: Record<string, unknown>, { fromPhone = false } = {}) {
  const json = withoutNulls(options) as Record<string, unknown> & { challenge: string };
  const publicKey = {
    ...json,
    challenge: toBuffer(json.challenge),
    allowCredentials: descriptors(json.allowCredentials),
    ...(fromPhone ? { hints: ['hybrid'] } : {}),
  } as unknown as PublicKeyCredentialRequestOptions;

  const credential = (await navigator.credentials.get({ publicKey })) as PublicKeyCredential | null;
  if (!credential) throw new Error('No passkey was used.');
  const response = credential.response as AuthenticatorAssertionResponse;
  return {
    id: credential.id,
    rawId: toBase64Url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: toBase64Url(response.clientDataJSON),
      authenticatorData: toBase64Url(response.authenticatorData),
      signature: toBase64Url(response.signature),
      ...(response.userHandle ? { userHandle: toBase64Url(response.userHandle) } : {}),
    },
    clientExtensionResults: credential.getClientExtensionResults(),
  };
}

/** A cancelled or timed-out browser prompt, which isn't worth an error message. */
export const isPasskeyCancelled = (error: unknown) =>
  error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'AbortError');
