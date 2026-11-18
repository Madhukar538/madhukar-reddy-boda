/** The HTML editors' preview (posts and pages). */

// The preview runs in a sandboxed frame with scripts off, so even unsaved,
// unsanitised HTML can't touch the admin page. The API sanitises on save.
export const previewDoc = (html: string) => `<!doctype html><html><head><meta charset="utf-8"><style>
body{font:16px/1.7 system-ui,sans-serif;color:#1d1d1f;background:#fff;max-width:720px;margin:0 auto;padding:24px}
@media (prefers-color-scheme:dark){body{color:#f5f5f7;background:#1c1c1e}a{color:#64a8ff}}
h2{font-size:1.5em;margin:1.6em 0 .5em}h3{font-size:1.2em;margin:1.4em 0 .4em}
pre{background:rgba(127,127,127,.12);padding:12px;border-radius:10px;overflow:auto;font-size:13px}
code{font-family:ui-monospace,monospace;font-size:.9em}img{max-width:100%}
blockquote{margin:1em 0;padding:.6em 1em;border-left:3px solid #3b82f6;background:rgba(59,130,246,.08);border-radius:6px}
table{border-collapse:collapse}td,th{border:1px solid rgba(127,127,127,.3);padding:4px 8px}
figure.media{margin:1.6em 0}figure.media img{display:block;width:100%;height:auto;border-radius:12px}figcaption{opacity:.75;font-size:.95em;margin-top:.5em}
figure.media-overlay{position:relative;overflow:hidden;border-radius:12px}figure.media-overlay img{border-radius:0;min-height:12em;object-fit:cover}
figure.media-overlay figcaption{position:absolute;inset:auto 0 0 0;margin:0;padding:3em 1.2em 1em;color:#fff;opacity:1;background:linear-gradient(to top,rgba(0,0,0,.78),transparent)}
figure.media-side{display:grid;grid-template-columns:1fr 1fr;gap:1em;align-items:center}figure.media-side figcaption{opacity:1;margin:0}
figure.media-wide{margin-inline:-24px}figure.media-wide figcaption{text-align:center;font-size:.85em}
</style></head><body>${html}</body></html>`;
