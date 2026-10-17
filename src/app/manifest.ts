import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Boda Madhukar Reddy | Software Architect',
    short_name: 'Boda Madhukar',
    description: 'Portfolio of Boda Madhukar Reddy, Software Architect specializing in .NET and AI platforms.',
    start_url: '/',
    display: 'standalone',
    // Midnight, the default look, so the splash screen and title bar match the site.
    background_color: '#070a12',
    theme_color: '#070a12',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
