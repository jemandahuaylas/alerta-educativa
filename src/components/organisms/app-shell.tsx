
"use client"

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Brand } from "@/components/atoms/brand";
import { MainNav } from "@/components/molecules/main-nav";
import { UserNav } from "@/components/molecules/user-nav";
import { BottomNav } from "../molecules/bottom-nav";
import { usePageHeader } from "@/hooks/use-page-header";
import { Button } from '../ui/button';
import { ArrowLeft, MoreVertical, PlusCircle } from 'lucide-react';
import { ResponsiveDropdownMenu, ResponsiveDropdownMenuContent, ResponsiveDropdownMenuItem, ResponsiveDropdownMenuTrigger } from '../ui/responsive-dropdown-menu';
import { useAppContext } from '@/context/app-context';
import { Loader2 } from 'lucide-react';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { title, actions } = usePageHeader();
  const pathname = usePathname();
  const router = useRouter();
  const { session, isLoading } = useAppContext();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    if (!isLoading && !session) {
      router.replace('/login');
    }
  }, [isLoading, session, router]);
  
  if (isLoading || !session) {
     return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const isDashboard = pathname === '/dashboard';

  const renderMobileActions = () => {
    if (!actions || !React.isValidElement(actions) || !actions.props.children) {
        return null;
    }

    const childrenArray = React.Children.toArray(actions.props.children).filter(
        (child): child is React.ReactElement => React.isValidElement(child)
    );

    if (childrenArray.length === 0) {
        return null;
    }

    const mainActionChild = childrenArray.find(child => {
        if (child.props && typeof child.props.children === 'string') {
            const buttonText = child.props.children;
            const mainActionKeywords = ['Añadir', 'Crear', 'Registrar'];
            return mainActionKeywords.some(keyword => buttonText.includes(keyword));
        }
        if (child.props && React.isValidElement(child.props.children) && typeof child.props.children.props.children === 'string') {
            const buttonText = child.props.children.props.children;
            const mainActionKeywords = ['Añadir', 'Crear', 'Registrar'];
            return mainActionKeywords.some(keyword => buttonText.includes(keyword));
        }
        return false;
    });

    if (mainActionChild && mainActionChild.props.onClick) {
        return (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={mainActionChild.props.onClick}>
                <PlusCircle className="h-5 w-5" />
                <span className="sr-only">Añadir</span>
            </Button>
        );
    }
    
    if (childrenArray.length > 0) {
        return (
            <ResponsiveDropdownMenu>
                <ResponsiveDropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-5 w-5" />
                        <span className="sr-only">Más acciones</span>
                    </Button>
                </ResponsiveDropdownMenuTrigger>
                <ResponsiveDropdownMenuContent>
                    {childrenArray.map((child, index) => (
                        <ResponsiveDropdownMenuItem key={index} asChild>
                            {React.cloneElement(child, {
                                className: "w-full justify-start gap-2",
                                variant: "ghost"
                            })}
                        </ResponsiveDropdownMenuItem>
                    ))}
                </ResponsiveDropdownMenuContent>
            </ResponsiveDropdownMenu>
        );
    }

    return null;
  };


  return (
    <SidebarProvider>
        <Sidebar variant="sidebar" collapsible="icon" className="hidden md:flex">
          <SidebarHeader>
            <Brand />
          </SidebarHeader>
          <SidebarContent>
            <MainNav />
          </SidebarContent>
          <SidebarFooter>
            <UserNav />
            <SidebarTrigger />
          </SidebarFooter>
        </Sidebar>
      
        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 sm:px-6 md:hidden">
            {!isDashboard ? (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                    <span className="sr-only">Volver</span>
                </Button>
            ) : (
                 <div className="w-8" />
            )}
            <div className="flex-1 text-center font-bold text-lg truncate">{title}</div>
            <div className="w-8">
                {renderMobileActions()}
            </div>
          </header>
          <main className="flex-1 p-4 sm:px-6 sm:py-8 bg-transparent pb-24 md:pb-6 overflow-x-hidden">
            {children}
          </main>
        </SidebarInset>

      {isClient && <BottomNav />}
    </SidebarProvider>
  );
}

    

    