// Re-mounts on every route change, giving each page a soft entrance.
// A CSS animation (see .page-enter in globals.css), so the page is painted
// from the server HTML without waiting for JavaScript.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
