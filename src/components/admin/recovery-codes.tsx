'use client';

import { useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import { secondaryButton } from './ui';

/** Freshly issued recovery codes, shown once, with copy and download. */
export function RecoveryCodeList({ codes }: { codes: string[] }) {
  const [copied, setCopied] = useState(false);
  const text = `dhucar.in admin recovery codes (each works once)\n\n${codes.join('\n')}\n`;
  return (
    <div className="space-y-3">
      <ol className="grid grid-cols-1 gap-1.5 rounded-xl bg-foreground/[0.04] p-4 font-mono text-sm sm:grid-cols-2">
        {codes.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={secondaryButton}
          onClick={async () => {
            await navigator.clipboard.writeText(text);
            setCopied(true);
          }}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <a className={secondaryButton} download="dhucar-admin-recovery-codes.txt" href={`data:text/plain;charset=utf-8,${encodeURIComponent(text)}`}>
          <Download className="h-4 w-4" />
          Download
        </a>
      </div>
    </div>
  );
}
