/**
 * After a deploy, a page loaded from the previous build can ask for code files
 * (/_next/static/chunks/…) that no longer exist, e.g. when it lazy-loads desktop
 * mode. Reloading fetches the current build. Guarded so a real outage can never
 * cause a reload loop: at most once every 30 seconds per tab.
 */
export const CHUNK_ERROR = /ChunkLoadError|Loading chunk [\w-]+ failed|Loading CSS chunk|Failed to fetch dynamically imported module|Importing a module script failed/i;

export function reloadForNewBuild() {
  try {
    const last = Number(sessionStorage.getItem('chunk-reload-at') || 0);
    if (Date.now() - last < 30_000) return false;
    sessionStorage.setItem('chunk-reload-at', String(Date.now()));
  } catch {
    // No storage (private mode): still reload, the error page is worse.
  }
  window.location.reload();
  return true;
}

/** Same check and guard, as an inline script for app/layout so it works before React loads. */
export const chunkReloadScript = `(function(){var re=${CHUNK_ERROR.toString()};function go(m){if(!re.test(m||''))return;try{var t=+sessionStorage.getItem('chunk-reload-at')||0;if(Date.now()-t<30000)return;sessionStorage.setItem('chunk-reload-at',String(Date.now()))}catch(e){}location.reload()}addEventListener('error',function(e){go((e.error&&(e.error.name+' '+e.error.message))||e.message)},true);addEventListener('unhandledrejection',function(e){var r=e.reason;go(r&&(r.name+' '+r.message))})})();`;
