import type { Metadata } from 'next';
import './globals.css';
import '@/styles/mobile-keyboard.css';
import { Toaster } from "@/components/ui/toaster";
import { AppProvider } from '@/context/app-context';
import { SettingsProvider } from '@/context/settings-context';
import { AppLayoutClient } from './app-layout-client';

export const metadata: Metadata = {
  title: 'Alerta Educativa',
  description: 'Gestione su institución educativa con facilidad.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AppProvider>
          <SettingsProvider>
            <AppLayoutClient>
              {children}
            </AppLayoutClient>
            <Toaster />
          </SettingsProvider>
        </AppProvider>
      </body>
    </html>
  );
}
