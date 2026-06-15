import type { MetadataRoute } from 'next';

// Web app manifest so the trainer can be installed / added to the home screen.
// Local-first, offline-friendly content; no accounts or remote data required.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Grandmaster Path Alpha',
    short_name: 'Grandmaster Path',
    description: 'Play, solve puzzles, learn, and study model games — a local-first chess trainer for adults and families.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0f172a',
    orientation: 'portrait-primary',
    categories: ['games', 'education'],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
