import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { calloutIcon, type CalloutKind } from './callout-icons';

/** Obsidian's callout block: a tinted box with an icon and title. Colours live in globals.css (.callout). */
export function Callout({
  kind = 'note',
  title,
  children,
  className,
}: {
  kind?: CalloutKind;
  title: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('callout', className)} data-callout={kind}>
      <div className="callout-title">
        <span className="contents" dangerouslySetInnerHTML={{ __html: calloutIcon(kind) }} />
        <span>{title}</span>
      </div>
      {children && <div className="callout-content">{children}</div>}
    </div>
  );
}
