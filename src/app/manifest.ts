import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Boda Madhukar Reddy | Software Architect',
    short_name: 'Boda Madhukar',
    description: 'Portfolio of Boda Madhukar Reddy, Software Architect specializing in .NET and AI platforms.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b132b',
    theme_color: '#3b82f6',
    icons: [
      {
        src: '/icon.png',
        sizes: 'any',
        type: 'image/png',
      },
      {
        src: '/madhukar.png',
        sizes: '220x220',
        type: 'image/png',
      },
    ],
  };
}
