import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Boda Madhukar Reddy | Senior Software Engineer · AI Architect · Agentic AI Developer',
    short_name: 'Boda Madhukar',
    description: 'Portfolio of Boda Madhukar Reddy, Senior Software Engineer, AI architect and agentic AI developer specializing in .NET, AI platforms and teams of coding agents.',
    start_url: '/',
    display: 'standalone',
    // Midnight, the default look, so the splash screen and title bar match the site.
    background_color: '#110f0d',
    theme_color: '#110f0d',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
