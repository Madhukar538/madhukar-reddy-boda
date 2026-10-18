'use client';

import { useEffect, useState } from 'react';
import { Check, Link2, Linkedin, Mail, MessageCircle, Send, Share2, Twitter } from 'lucide-react';

/**
 * Share links built from the live URL, so they work on any domain. Where the
 * browser has a share sheet (phones, Safari), a Share button opens it first.
 */
export function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare(typeof navigator.share === 'function'), []);

  const open = (build: (url: string, text: string) => string) => () => {
    const url = window.location.href.split('#')[0];
    window.open(build(encodeURIComponent(url), encodeURIComponent(title)), '_blank', 'noopener,noreferrer');
  };

  const targets = [
    { label: 'LinkedIn', icon: Linkedin, onClick: open((u) => `https://www.linkedin.com/sharing/share-offsite/?url=${u}`) },
    { label: 'X', icon: Twitter, onClick: open((u, t) => `https://twitter.com/intent/tweet?url=${u}&text=${t}`) },
    { label: 'WhatsApp', icon: MessageCircle, onClick: open((u, t) => `https://wa.me/?text=${t}%20${u}`) },
    { label: 'Telegram', icon: Send, onClick: open((u, t) => `https://t.me/share/url?url=${u}&text=${t}`) },
    {
      label: 'Email',
      icon: Mail,
      onClick: () => {
        const url = window.location.href.split('#')[0];
        window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${title}\n\n${url}`)}`;
      },
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canShare && (
        <button
          type="button"
          onClick={() => navigator.share({ title, url: window.location.href.split('#')[0] }).catch(() => {})}
          className="flex h-9 items-center gap-1.5 rounded-full bg-primary/15 px-3.5 text-sm font-medium text-foreground ring-1 ring-primary/40 hover:bg-primary/25 transition-colors"
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
      )}
      {targets.map(({ label, icon: Icon, onClick }) => (
        <button
          key={label}
          type="button"
          onClick={onClick}
          aria-label={`Share on ${label}`}
          title={`Share on ${label}`}
          className="flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-foreground/15 text-foreground/70 hover:bg-foreground/10 hover:text-foreground transition-colors"
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(window.location.href.split('#')[0]);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium ring-1 ring-foreground/15 text-foreground/70 hover:bg-foreground/10 hover:text-foreground transition-colors"
      >
        {copied ? <Check className="h-4 w-4 text-[hsl(var(--sys-green))]" /> : <Link2 className="h-4 w-4" />}
        {copied ? 'Copied' : 'Copy link'}
      </button>
    </div>
  );
}
