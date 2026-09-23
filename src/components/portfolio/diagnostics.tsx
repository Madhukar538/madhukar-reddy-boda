'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Cpu, Network } from 'lucide-react';

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

  const latestLog = logs[logs.length - 1]?.replace(/^\[(INFO|DEBUG)\]\s*/, '');

  const stats = [
    { icon: Activity, label: 'Uptime', value: formatUptime(uptime) },
    { icon: Cpu,      label: 'Heap',   value: `${memory} MB` },
    { icon: Network,  label: 'Ping',   value: `${ping} ms` },
  ];

  return (
    <div className="glass-inset p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground/80">Live Status</span>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-[hsl(var(--sys-green))]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(var(--sys-green))] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[hsl(var(--sys-green))]" />
          </span>
          Online
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl bg-background/40 dark:bg-white/5 px-2 py-2 text-center">
            <Icon className="mx-auto mb-1 h-3.5 w-3.5 text-primary" />
            <p className="text-[11px] font-semibold tabular-nums text-foreground">{value}</p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="h-4 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={logs.length + (latestLog ?? '')}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="truncate text-[11px] text-muted-foreground"
          >
            {latestLog}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
