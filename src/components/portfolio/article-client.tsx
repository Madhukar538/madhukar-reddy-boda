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
      button.className = 'copy-btn absolute top-3 right-3 px-2 py-1 rounded text-[10px] font-semibold bg-white/5 border border-white/10 hover:bg-white/15 text-muted-foreground hover:text-foreground transition-all duration-200';
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
        className="fixed top-0 left-0 right-0 h-1 bg-accent z-[100] origin-left transition-all duration-100" 
        style={{ transform: `scaleX(${scrollProgress / 100})` }}
      />
      
      {/* Article Body */}
      <div 
        className="relative space-y-6 text-muted-foreground leading-relaxed text-sm md:text-base
          [&>p>code]:bg-white/10 [&>p>code]:px-1.5 [&>p>code]:py-0.5 [&>p>code]:rounded [&>p>code]:text-xs [&>p>code]:text-accent
          [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-foreground [&>h2]:mt-10 [&>h2]:mb-4 [&>h2]:font-headline
          [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-2
          [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:space-y-2
          [&>p.lead]:text-lg [&>p.lead]:text-foreground/80 [&>p.lead]:leading-relaxed"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </>
  );
}
