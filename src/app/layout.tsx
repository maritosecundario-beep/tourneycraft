import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { TournamentProvider } from '@/hooks/use-tournament-store';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'TourneyCraft | Professional Tournament Management',
  description: 'Diseña, simula y gestiona torneos personalizables.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

import { FirebaseClientProvider } from '@/firebase/client-provider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground min-h-screen">
        <FirebaseClientProvider>
          <TournamentProvider>
            <div className="flex flex-col md:flex-row min-h-screen">
              <Navbar />
              <main className="min-h-screen w-full min-w-0 flex-1 overflow-x-clip px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-[calc(4.25rem+env(safe-area-inset-top))] sm:px-4 md:ml-64 md:px-8 md:py-8 md:pb-8 md:pt-8">
                {children}
              </main>
            </div>
            <Toaster />
          </TournamentProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}