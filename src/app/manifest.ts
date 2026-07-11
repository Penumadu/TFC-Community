import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TFC Community Portal',
    short_name: 'TFC Portal',
    description:
      'The trusted community platform for Telugu families in Halton Region & GTA — tradespeople, venues, childcare, and more.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FAFAF7',
    theme_color: '#005A70',
    categories: ['social', 'lifestyle', 'utilities'],
    lang: 'en',
    dir: 'ltr',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'Find a Tradesperson',
        short_name: 'Directory',
        description: 'Browse Telugu-speaking tradespeople in Halton',
        url: '/directory',
        icons: [{ src: '/icons/shortcut-directory.png', sizes: '96x96' }],
      },
      {
        name: 'Find a Venue',
        short_name: 'Venues',
        description: 'Browse community halls and banquet spaces',
        url: '/venues',
        icons: [{ src: '/icons/shortcut-venues.png', sizes: '96x96' }],
      },
    ],
    prefer_related_applications: false,
    screenshots: [],
  }
}
