'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Activity, Cpu, Network, Terminal } from 'lucide-react';

const mockLogs = [
  '[INFO] Initializing portfolio components... success',
  '[DEBUG] Scanning local storage for user preferences... done',
  '[INFO] Loading static blog database: 5 posts parsed',
  '[DEBUG] Binding scroll-spy scroll events to IntersectionObserver',
  '[INFO] Setting theme to system default or user custom',
  '[DEBUG] Initializing responsive bottom navigation dock',
  '[INFO] Checking connection handshake with CDN... OK',
  '[DEBUG] Memory cleanup: garbage collection completed successfully',
  '[INFO] System metrics check: ALL SYSTEMS OPERATIONAL',
  '[DEBUG] Background worker listening for navigation triggers',
  '[INFO] Hydrating UI components with Tailwind theme tokens',
  '[DEBUG] API routes preloaded: /api/insights, /api/contact',
  '[INFO] Heartbeat check: ACK received in 12ms',
  '[DEBUG] Initializing WebRTC hooks for mock video streams',
  '[INFO] Hydration complete. Welcome to Boda Madhukar Reddy\'s portfolio',
];

export function Diagnostics() {
  const [uptime, setUptime] = useState(0);
  const [memory, setMemory] = useState(38.4);
  const [ping, setPing] = useState(14);
  const [logs, setLogs] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Uptime clock
  useEffect(() => {
    const timer = setInterval(() => {
      setUptime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format uptime to hh:mm:ss
  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  // 2. Memory & Ping fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      // Memory oscillates around 38-44 MB
      setMemory((prev) => {
        const change = (Math.random() - 0.5) * 0.8;
        const next = prev + change;
        return parseFloat(Math.min(Math.max(next, 36.0), 45.0).toFixed(1));
      });
      // Ping oscillates around 10-25 ms
      setPing((prev) => {
        const change = Math.floor((Math.random() - 0.5) * 6);
        const next = prev + change;
        return Math.min(Math.max(next, 8), 35);
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // 3. Rolling logs
  useEffect(() => {
    // Add first 3 logs immediately
    setLogs(mockLogs.slice(0, 3));

    let logIndex = 3;
    const interval = setInterval(() => {
      setLogs((prev) => {
        const nextLogs = [...prev, mockLogs[logIndex]];
        // Keep last 15 logs
        if (nextLogs.length > 15) {
          nextLogs.shift();
        }
        return nextLogs;
      });
      logIndex = (logIndex + 1) % mockLogs.length;
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll logs container ONLY (prevents window scrollIntoView lag/jump)
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="font-mono text-[11px] space-y-2 bg-background/40 border border-border/80 rounded-sm p-3 shadow-inner">
      <div className="flex items-center justify-between border-b border-border/40 pb-1.5 mb-1.5">
        <span className="text-muted-foreground/60 flex items-center gap-1.5">
          <Terminal className="h-3 w-3 text-primary" />
          {'// diagnostics.sys'}
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-foreground/80">
        <div className="flex items-center gap-1.5">
          <Activity className="h-3 w-3 text-primary/70 shrink-0" />
          <span className="text-muted-foreground/50">UPTIME:</span>
          <span className="text-primary font-medium tabular-nums">{formatUptime(uptime)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Cpu className="h-3 w-3 text-primary/70 shrink-0" />
          <span className="text-muted-foreground/50">HEAP:</span>
          <span className="font-medium tabular-nums">{memory} MB</span>
        </div>
        <div className="flex items-center gap-1.5 col-span-2">
          <Network className="h-3 w-3 text-primary/70 shrink-0" />
          <span className="text-muted-foreground/50">PING:</span>
          <span className="font-medium tabular-nums text-accent">{ping} ms</span>
          <span className="text-muted-foreground/30">|</span>
          <span className="text-muted-foreground/50">STATUS:</span>
          <span className="text-emerald-500 font-semibold uppercase text-[9px] tracking-wide">ONLINE</span>
        </div>
      </div>

      {/* Rolling logs container */}
      <div
        ref={containerRef}
        className="border border-border/30 rounded-sm bg-black/30 p-2 mt-2 h-20 overflow-y-auto scrollbar-thin select-text scroll-smooth"
      >
        <div className="space-y-1">
          {logs.map((log, index) => {
            const isInfo = log.includes('[INFO]');
            return (
              <p
                key={index}
                className={isInfo ? 'text-foreground/70' : 'text-primary/70'}
              >
                {log}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
}
