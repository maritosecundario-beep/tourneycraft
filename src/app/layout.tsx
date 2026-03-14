import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { TournamentProvider } from '@/hooks/use-tournament-store';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'TourneyCraft | Professional Tournament Management',
  description: 'Design, simulate, and manage highly customizable tournaments with AI-powered features.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground min-h-screen">
        <TournamentProvider>
          <div className="flex flex-col md:flex-row min-h-screen">
            <Navbar />
            <main className="flex-1 w-full md:ml-64 p-4 md:p-8 pb-24 md:pb-8 min-h-screen">
              {children}
            </main>
          </div>
          <Toaster />
        </TournamentProvider>
      </body>
    </html>
  );
}