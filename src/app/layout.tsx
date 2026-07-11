import type { Metadata, Viewport } from 'next'
import './globals.css'
import { LanguageProvider } from '@/lib/i18n/LanguageContext'

export const metadata: Metadata = {
  title: {
    default: 'TFC Community Portal',
    template: '%s | TFC Community Portal',
  },
  description:
    'The trusted community platform for Telugu families in Halton Region (Milton, Oakville, Burlington, Halton Hills) and the Greater Toronto Area.',
  keywords: [
    'Telugu community',
    'Halton',
    'GTA',
    'Milton',
    'Oakville',
    'Burlington',
    'tradesperson',
    'childcare',
    'community hall',
    'Telugu-speaking',
  ],
  authors: [{ name: 'TFC Community Portal' }],
  creator: 'TFC Community Portal',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://tfccommunity.ca'),
  openGraph: {
    type: 'website',
    locale: 'en_CA',
    url: '/',
    siteName: 'TFC Community Portal',
    title: 'TFC Community Portal',
    description: 'Trusted community platform for Telugu families in Halton & GTA',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'TFC Community Portal' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TFC Community Portal',
    description: 'Trusted community platform for Telugu families in Halton & GTA',
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TFC Portal',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: '#005A70',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&family=Noto+Sans+Telugu:wght@400;500;600;700&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&family=Noto+Sans+Telugu:wght@400;500;600;700&display=swap"
        />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-dvh bg-bg font-sans antialiased">
        <LanguageProvider>
          <div id="app-root" className="flex flex-col min-h-dvh">
            {children}
          </div>
        </LanguageProvider>
        {/* Service Worker registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
