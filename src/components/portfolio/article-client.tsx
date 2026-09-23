'use client';

import { useState, useEffect } from 'react';

interface ArticleClientProps {
  content: string;
}

export function ArticleClient({ content }: ArticleClientProps) {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Select all code blocks inside pre elements
    const preElements = document.querySelectorAll('pre');
    preElements.forEach((pre) => {
      if (pre.querySelector('.copy-btn')) return;

      const button = document.createElement('button');
      button.className = 'copy-btn absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-foreground/10 hover:bg-foreground/15 text-muted-foreground hover:text-foreground transition-all duration-200';
      button.innerText = 'Copy';
      
      pre.style.position = 'relative';
      
      button.addEventListener('click', () => {
        const code = pre.querySelector('code')?.innerText || pre.innerText.replace('Copy', '');
        navigator.clipboard.writeText(code);
        button.innerText = 'Copied!';
        setTimeout(() => {
          button.innerText = 'Copy';
        }, 2000);
      });
      pre.appendChild(button);
    });
  }, [content]);

  return (
    <>
      {/* Scroll Progress Bar */}
      <div 
        className="fixed top-0 left-0 right-0 h-[3px] bg-primary z-[300] origin-left transition-transform duration-100 shadow-[0_0_12px_hsl(var(--primary)/0.6)]"
        style={{ transform: `scaleX(${scrollProgress / 100})` }}
      />
      
      {/* Article Body */}
      <div 
        className="article-body relative space-y-6 text-foreground/80 leading-relaxed text-[15px] md:text-[17px]
          [&_p>code]:bg-foreground/10 [&_p>code]:px-1.5 [&_p>code]:py-0.5 [&_p>code]:rounded-md [&_p>code]:text-[0.85em] [&_p>code]:text-primary
          [&_li>code]:bg-foreground/10 [&_li>code]:px-1.5 [&_li>code]:py-0.5 [&_li>code]:rounded-md [&_li>code]:text-[0.85em] [&_li>code]:text-primary
          [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:tracking-tight [&>h2]:text-foreground [&>h2]:mt-10 [&>h2]:mb-4
          [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-2 [&>ul]:marker:text-primary
          [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:space-y-2
          [&>p.lead]:text-lg [&>p.lead]:text-foreground/80 [&>p.lead]:leading-relaxed"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </>
  );
}
