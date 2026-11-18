'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Check, Copy, Globe2 } from 'lucide-react';
import { errorMessage } from '@/lib/admin/api';
import { AdminShell } from '@/components/admin/admin-shell';
import { useAdmin } from '@/components/admin/session';
import { Field, Notice, Panel, Spinner, fieldClass, formatDateTime } from '@/components/admin/ui';

type Site = { id: string; name: string; hosts: string[]; status: 'active' | 'suspended'; createdAt: string };
type Created = { id: string; setupToken: string };

/**
 * The platform's sites (Portfolio as a Service): every site besides this one, each with its own
 * database. Adding one shows its setup token once: whoever creates the site's first admin needs it,
 * and only its hash is kept. Only this site's own admin sees this page's data.
 */
function SitesConsole() {
  const { call } = useAdmin();
  const [sites, setSites] = useState<Site[] | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ slug: '', name: '', hosts: '' });
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<Created | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      setSites(await call<Site[]>('GetSites'));
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [call]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const hosts = form.hosts.split(/[\s,]+/).map((h) => h.trim()).filter(Boolean);
      const result = await call<Created>('CreateSite', { slug: form.slug.trim(), name: form.name.trim(), hosts });
      setCreated(result);
      setForm({ slug: '', name: '', hosts: '' });
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (site: Site, status: Site['status']) => {
    if (status === 'suspended' && !window.confirm(`Suspend ${site.name}? Its domain and API answer "not found" until you reactivate it.`)) return;
    try {
      await call('SetSiteStatus', { slug: site.id, status });
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <div className="space-y-5">
      {error && <Notice>{error}</Notice>}

      {created && (
        <Panel title="Site created: copy its setup token now" description="It is shown only once. The site's first admin uses it to set up their account; only its hash is stored.">
          <div className="flex flex-wrap items-center gap-3">
            <code className="glass-inset min-w-0 flex-1 break-all rounded-lg px-3 py-2 font-mono text-sm">{created.setupToken}</code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(created.setupToken);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="tinted-button !px-4 !py-2"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <button type="button" onClick={() => setCreated(null)} className="mt-3 text-sm text-muted-foreground hover:text-foreground">
            I&apos;ve saved it
          </button>
        </Panel>
      )}

      <Panel title="Sites" description="Every portfolio on the platform besides this one. A suspended site's domain and API answer like an unknown one.">
        {sites === null ? (
          <Spinner />
        ) : sites.length === 0 ? (
          <p className="text-sm text-muted-foreground">No other sites yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {sites.map((site) => (
              <li key={site.id} className="flex flex-wrap items-center gap-4 py-3.5">
                <Globe2 aria-hidden className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {site.name} <code className="ml-1 text-xs text-muted-foreground">{site.id}</code>
                    {site.status === 'suspended' && <span className="chip ml-2 align-middle">Suspended</span>}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {site.hosts.length > 0 ? site.hosts.join(', ') : 'No domain yet'} · added {formatDateTime(site.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStatus(site, site.status === 'active' ? 'suspended' : 'active')}
                  className="rounded-full px-4 py-1.5 text-sm font-medium ring-1 ring-foreground/15 hover:bg-foreground/[0.06]"
                >
                  {site.status === 'active' ? 'Suspend' : 'Reactivate'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <form onSubmit={create}>
        <Panel title="Add a site" description="Its own empty database is created at once. Point its domain at this app (and set SITES_ENABLED) to serve it.">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Slug" hint="3–32: a–z, 0–9, -">
              <input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })} placeholder="asha" className={fieldClass} />
            </Field>
            <Field label="Name">
              <input required maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Asha Rao" className={fieldClass} />
            </Field>
            <Field label="Domains" hint="Comma-separated, up to 5">
              <input value={form.hosts} onChange={(e) => setForm({ ...form, hosts: e.target.value })} placeholder="asha.example.com" className={fieldClass} />
            </Field>
          </div>
          <button type="submit" disabled={busy} className="tinted-button mt-4">
            {busy ? 'Adding…' : 'Add site'}
          </button>
        </Panel>
      </form>
    </div>
  );
}

export default function SitesPage() {
  return (
    <AdminShell title="Sites">
      <SitesConsole />
    </AdminShell>
  );
}
