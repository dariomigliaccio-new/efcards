import type { Metadata } from 'next';
import './globals.css';
import { SmoothScroll } from '@/components/animations/SmoothScroll';
import { Navigation } from '@/components/layout/Navigation';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'CardMatch — Trade. Bid. Collect.',
  description: 'The modern marketplace for sports stickers and cards. Soccer, Baseball, NBA, NFL.',
  keywords: 'sports cards, stickers, panini, topps, trade, bid, collect, marketplace',
  openGraph: {
    title: 'CardMatch',
    description: 'The modern marketplace for sports stickers and cards.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="bg-[#080808] text-[#f0ede8] antialiased">
        {/* Cinematic grain overlay */}
        <div className="grain-overlay" aria-hidden="true" />

        <SmoothScroll>
          <Navigation />
          <main>{children}</main>
        </SmoothScroll>

        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#141414',
              color: '#f0ede8',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              fontSize: '0.875rem',
            },
          }}
        />
      </body>
    </html>
  );
}
