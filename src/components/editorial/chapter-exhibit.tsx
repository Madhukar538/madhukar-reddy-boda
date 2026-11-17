import type { StoryExhibit } from '@/lib/story';

/**
 * The exhibit beside each chapter of the Editorial journey (editorial-story.tsx): a small piece of
 * evidence that animates in when the chapter arrives (the reveal sets data-in; globals.css runs the
 * animation from it). Without the script, or with reduced motion, each shows its finished state.
 * Six kinds, each filled from the site's story (lib/story.ts).
 */

const n = (i: number) => ({ '--n': i }) as React.CSSProperties;

function Exhibit({ exhibit }: { exhibit: Exclude<StoryExhibit, { kind: 'none' }> }) {
  switch (exhibit.kind) {
    case 'ticket':
      return (
        <div className="ex-ticket">
          <p className="ex-kicker">{exhibit.kicker}</p>
          <p className="ex-big">{exhibit.big}</p>
          {exhibit.line && <p>{exhibit.line}</p>}
          {exhibit.mono && <p className="ex-mono">{exhibit.mono}</p>}
          {exhibit.stamp && <span className="ex-stamp">{exhibit.stamp}</span>}
        </div>
      );
    case 'list':
      return (
        <div className="ex-brands">
          <p className="ex-kicker">{exhibit.kicker}</p>
          <ul>
            {exhibit.items.map((item, i) => (
              <li key={item} style={n(i)}>
                {item}
              </li>
            ))}
          </ul>
          {exhibit.tag && <p className="ex-tag">{exhibit.tag}</p>}
        </div>
      );
    case 'bars':
      return (
        <div className="ex-bars">
          <p className="ex-kicker">{exhibit.kicker}</p>
          {exhibit.rows.map((row) => (
            <div key={row.label} className="ex-bar-row">
              <span>{row.label}</span>
              <span className={`ex-bar ex-bar-${row.tone}`} />
              <strong>{row.value}</strong>
            </div>
          ))}
          {exhibit.note && <p className="ex-mono">{exhibit.note}</p>}
        </div>
      );
    case 'tree':
      return (
        <div className="ex-tree">
          <p className="ex-kicker">{exhibit.kicker}</p>
          <ul>
            {exhibit.items.map((item, i) => (
              <li key={item} style={n(i)}>
                <span aria-hidden>{i === exhibit.items.length - 1 ? '└─' : '├─'}</span> {item}
              </li>
            ))}
          </ul>
          {exhibit.note && <p className="ex-mono">{exhibit.note}</p>}
        </div>
      );
    case 'grid':
      return (
        <div className="ex-grid">
          <p className="ex-kicker">{exhibit.kicker}</p>
          <div className="ex-cells">
            {Array.from({ length: exhibit.cells }, (_, i) => (
              <span key={i} style={n(i)} />
            ))}
          </div>
          {exhibit.big && <p className="ex-big ex-big-sm">{exhibit.big}</p>}
          {exhibit.note && <p className="ex-mono">{exhibit.note}</p>}
        </div>
      );
    case 'team':
      return (
        <div className="ex-org">
          <p className="ex-kicker">{exhibit.kicker}</p>
          {exhibit.rows.map((row, r) => (
            <div key={r} className="ex-org-row">
              {row.map((node) => (
                <span key={node.label} className={`ex-org-node${node.tone === 'member' ? '' : ` ex-org-${node.tone}`}`}>
                  {node.label}
                </span>
              ))}
            </div>
          ))}
          {exhibit.bar && (
            <div className="ex-bar-row">
              <span>{exhibit.bar.label}</span>
              <span className="ex-bar ex-bar-shrink" />
              <strong>{exhibit.bar.value}</strong>
            </div>
          )}
        </div>
      );
  }
}

export function ChapterExhibit({ exhibit }: { exhibit: StoryExhibit }) {
  if (exhibit.kind === 'none') return null;
  return (
    <aside className="ed-exhibit ed-reveal" aria-hidden>
      <Exhibit exhibit={exhibit} />
    </aside>
  );
}
