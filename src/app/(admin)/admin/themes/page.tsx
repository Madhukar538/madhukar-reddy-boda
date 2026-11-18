'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ExternalLink } from 'lucide-react';
import { errorMessage } from '@/lib/admin/api';
import type { SaveResult, ThemeSettings } from '@/lib/admin/types';
import { cn } from '@/lib/utils';
import { THEMES } from '@/components/look-toggle';
import { AdminShell } from '@/components/admin/admin-shell';
import { useAdmin } from '@/components/admin/session';
import { SaveBar, ensureRefreshed, savedMessage, useLeaveGuard, type Status } from '@/components/admin/editor';
import { Notice, Panel, Spinner } from '@/components/admin/ui';

type Form = { defaultTheme: string; enabled: string[] };

const formOf = (settings: ThemeSettings): Form => ({
  defaultTheme: settings.defaultTheme,
  enabled: settings.themes.filter((t) => t.isEnabled).map((t) => t.id),
});

/** Which themes visitors can pick in the site's theme menu, and which one the site opens in. */
function ThemesEditor() {
  const { call, refreshSite } = useAdmin();
  const [settings, setSettings] = useState<ThemeSettings | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [saved, setSaved] = useState<Form | null>(null);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState<'save' | 'delete' | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await call<ThemeSettings>('GetThemes');
      setSettings(data);
      setForm(formOf(data));
      setSaved(formOf(data));
    } catch (e) {
      setLoadError(errorMessage(e));
    }
  }, [call]);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = form !== null && saved !== null && JSON.stringify(form) !== JSON.stringify(saved);
  useLeaveGuard(dirty);

  if (loadError) return <Notice>{loadError}</Notice>;
  if (!settings || !form) return <Spinner />;

  const toggle = (id: string) => {
    setStatus(null);
    setForm((f) => {
      if (!f) return f;
      const isOn = f.enabled.includes(id);
      // The default can't be switched off, and one theme always stays on.
      if (isOn && (id === f.defaultTheme || f.enabled.length === 1)) return f;
      const enabled = isOn ? f.enabled.filter((x) => x !== id) : [...f.enabled, id];
      return { ...f, enabled };
    });
  };

  const makeDefault = (id: string) => {
    setStatus(null);
    setForm((f) => (f ? { defaultTheme: id, enabled: f.enabled.includes(id) ? f.enabled : [...f.enabled, id] } : f));
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy('save');
    setStatus(null);
    try {
      const result = await call<SaveResult>('SaveThemes', { defaultTheme: form.defaultTheme, enabledThemes: form.enabled });
      setSaved(form);
      setStatus({ kind: 'success', text: savedMessage(await ensureRefreshed(result, ['themes'], refreshSite)) });
    } catch (err) {
      setStatus({ kind: 'error', text: errorMessage(err) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <form onSubmit={save}>
      <Panel
        title={`Preview: ${settings.themes.find((t) => t.id === (preview ?? form.defaultTheme))?.label ?? ''}`}
        description="The homepage as visitors see it in this theme, live. Pick a theme below to preview it; nothing changes until you save."
      >
        <ThemePreview look={preview ?? form.defaultTheme} />
      </Panel>
      <div className="h-6" />
      <Panel
        title="Site themes"
        description="Enabled themes appear in the site's theme menu. The default is what new visitors see; anyone who picked a theme you disable goes back to the default."
      >
        <ul className="divide-y divide-border">
          {settings.themes.map((theme) => {
            const look = THEMES.find((t) => t.id === theme.id);
            const isOn = form.enabled.includes(theme.id);
            const isDefault = form.defaultTheme === theme.id;
            return (
              <li key={theme.id} className="flex flex-wrap items-center gap-4 py-3.5">
                <button
                  type="button"
                  onClick={() => setPreview(theme.id)}
                  aria-label={`Preview ${theme.label}`}
                  aria-pressed={(preview ?? form.defaultTheme) === theme.id}
                  className={cn('h-9 w-9 shrink-0 rounded-lg ring-1 ring-foreground/20', (preview ?? form.defaultTheme) === theme.id && 'ring-2 ring-primary ring-offset-2 ring-offset-background')}
                  style={{ background: look?.swatch }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {theme.label}
                    {isDefault && <span className="chip chip-accent ml-2 align-middle">Default</span>}
                  </p>
                  <p className="text-sm text-muted-foreground">{theme.hint} · <code className="text-xs">{theme.id}</code></p>
                </div>
                <button type="button" onClick={() => setPreview(theme.id)} className="text-sm font-medium text-primary hover:underline">
                  Preview
                </button>
                <label className={cn('flex items-center gap-2 text-sm', isDefault && 'opacity-60')}>
                  <input
                    type="checkbox"
                    checked={isOn}
                    disabled={isDefault}
                    onChange={() => toggle(theme.id)}
                    className="h-4 w-4 accent-[hsl(var(--primary))]"
                  />
                  Enabled
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="default-theme"
                    checked={isDefault}
                    onChange={() => makeDefault(theme.id)}
                    className="h-4 w-4 accent-[hsl(var(--primary))]"
                  />
                  Default
                </label>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          With only one theme enabled, the site hides its theme menu. New themes are added in code (the API&apos;s theme registry and the site&apos;s styles), then appear here.
        </p>
      </Panel>
      <SaveBar busy={busy} dirty={dirty} status={status} />
    </form>
  );
}

/** The site's own homepage in a theme (?look=, applied for that view only), scaled down to fit. */
function ThemePreview({ look }: { look: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const fit = () => setScale(el.clientWidth / 1280);
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const src = `/?look=${encodeURIComponent(look)}`;
  return (
    <div>
      <div ref={frame} className="relative overflow-hidden rounded-lg ring-1 ring-foreground/15" style={{ height: 800 * scale }}>
        <iframe
          key={look}
          src={src}
          title={`The homepage in the ${look} theme`}
          tabIndex={-1}
          loading="lazy"
          className="pointer-events-none absolute left-0 top-0 origin-top-left border-0"
          style={{ width: 1280, height: 800, transform: `scale(${scale})` }}
        />
      </div>
      <a href={src} target="_blank" rel="noopener" className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
        Open full page <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

export default function ThemesPage() {
  return (
    <AdminShell title="Themes">
      <ThemesEditor />
    </AdminShell>
  );
}
