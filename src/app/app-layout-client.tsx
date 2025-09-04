"use client";

import { usePathname } from 'next/navigation';
import AppShell from '@/components/organisms/app-shell';
import { PageHeaderProvider } from '@/hooks/use-page-header';
import { DynamicFavicon } from '@/components/dynamic-favicon';
import { useMobileDetection, useVirtualKeyboard } from '@/hooks/use-mobile-detection';

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <DynamicFavicon />
      {children}
    </div>
  );
}

function MainAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background">
      <DynamicFavicon />
      <PageHeaderProvider>
        <AppShell>
            {children}
        </AppShell>
      </PageHeaderProvider>
    </div>
  )
}

export function AppLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
  
  // Detectar dispositivo móvil y teclado virtual
  useMobileDetection();
  useVirtualKeyboard();

  if (isAuthPage) {
    return <AuthLayout>{children}</AuthLayout>;
  }

  return <MainAppLayout>{children}</MainAppLayout>;
}