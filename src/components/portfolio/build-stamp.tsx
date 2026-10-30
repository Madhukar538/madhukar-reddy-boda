/**
 * The footer's build stamp: which commit of the site is live, when it was
 * built, and which release of the API it talks to (from the API's /health).
 * A server component; the API is asked at most every ten minutes and never
 * holds up the page (no API, or no answer within 1.5 s: the api part is left out).
 */
async function apiRelease(): Promise<{ version: string; commit: string } | null> {
  const base = (process.env.API_URL || '').replace(/\/$/, '');
  if (!base) return null;
  try {
    const res = await fetch(`${base}/health`, { next: { revalidate: 600 }, signal: AbortSignal.timeout(1500) });
    if (!res.ok) return null;
    const data = (await res.json()) as { version?: string; commit?: string };
    return data.version ? { version: data.version, commit: data.commit ?? '' } : null;
  } catch {
    return null;
  }
}

export async function BuildStamp() {
  const id = process.env.NEXT_PUBLIC_BUILD_ID ?? '';
  // A commit hash from the deploy, or a local build.
  const site = /^[0-9a-f]{7,}$/i.test(id) ? id.slice(0, 7) : 'local';
  const builtAt = process.env.NEXT_PUBLIC_BUILD_TIME;
  const deployed = builtAt
    ? new Date(builtAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
    : null;
  const api = await apiRelease();

  return (
    <p className="font-mono text-[0.7rem] text-muted-foreground" title={builtAt ? `Built ${builtAt}` : undefined}>
      build <span className="text-foreground/75">{site}</span>
      {deployed && <> · deployed {deployed}</>}
      {api && (
        <>
          {' '}· api <span className="text-foreground/75">v{api.version}</span>
          {api.commit && <> ({api.commit})</>}
        </>
      )}
    </p>
  );
}
