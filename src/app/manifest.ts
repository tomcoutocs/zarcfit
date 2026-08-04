import type { MetadataRoute } from 'next';

// CA-201: Web app manifest. Next.js serves this at /manifest.webmanifest and
// automatically injects the <link rel="manifest"> tag into <head> — no
// changes needed in layout.tsx metadata for that part.
//
// Colors are the sRGB conversion of the coral brand tokens in tokens.css
// (--color-accent / --color-paper, both defined in OKLCH).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ZarcFit - Coaching Software for Solo Trainers',
    short_name: 'ZarcFit',
    description: 'The all-in-one platform independent fitness coaches use to build programs, plan nutrition, and manage clients.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FBF9F5',
    theme_color: '#CB4A2A',
    orientation: 'portrait-primary',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
