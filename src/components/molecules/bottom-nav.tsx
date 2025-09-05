
"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from "next/link";
import { usePathname, useRouter } from 'next/navigation';
import { Menu, User, LayoutGrid, Users, AlertTriangle, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems, settingsNavItem } from './main-nav';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAppContext } from '@/context/app-context';
import { Button } from '../ui/button';
import * as authService from "@/core/services/auth-service";

function UserProfileSheet() {
    const { session, currentUserProfile, setSession } = useAppContext();
    const router = useRouter();

    const handleSignOut = async () => {
        await authService.signOut();
        setSession(null);
        router.push('/login');
    };

    const isAdminLevel = ['Admin', 'Director', 'Subdirector', 'Coordinador'].includes(currentUserProfile?.role || '');



    return (
        <Sheet>
            <SheetTrigger asChild>
                <button
                    type="button"
                    className="inline-flex flex-col items-center justify-center px-2 text-center text-muted-foreground group"

                >
                    <User className="w-5 h-5 mb-1" />
                    <span className="text-xs">Perfil</span>
                </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto">
                <SheetHeader className="mb-4 text-left">
                    <SheetTitle>{currentUserProfile?.name ?? 'Usuario'}</SheetTitle>
                    <SheetDescription>{session?.user?.email}</SheetDescription>
                </SheetHeader>
                <div className="flex flex-col gap-1">
                    {isAdminLevel && (
                        <Button variant="ghost" className="justify-start" onClick={() => router.push('/settings')}>Ajustes</Button>
                    )}
                    <Button variant="ghost" className="justify-start">Soporte</Button>
                    <Button variant="ghost" className="justify-start text-destructive" onClick={handleSignOut}>Cerrar Sesión</Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}

function MoreMenuSheet() {
    const { currentUserProfile } = useAppContext();
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    
    const isRestrictedUser = currentUserProfile?.role === 'Docente' || currentUserProfile?.role === 'Auxiliar';

    const allNavItems = useMemo(() => {
        if (!isRestrictedUser) return [...navItems.flatMap(group => group.items), settingsNavItem];
        
        const allowedHrefs = ["/dashboard", "/students", "/incidents", "/permisos", "/nee"];
        
        return navItems.flatMap(group => group.items)
        .filter(item => allowedHrefs.includes(item.href));

    }, [isRestrictedUser]);

    const moreNavItems = allNavItems.slice(3);

    if (moreNavItems.length === 0) {
        return <div className="invisible"></div>;
    }

    return (
        <Sheet open={isMoreMenuOpen} onOpenChange={setIsMoreMenuOpen}>
            <SheetTrigger asChild>
                 <button
                    type="button"
                    className="inline-flex flex-col items-center justify-center px-2 text-center text-muted-foreground group"
                >
                    <Menu className="w-5 h-5 mb-1" />
                    <span className="text-xs">Más</span>
                </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto">
                <SheetHeader className="mb-4">
                    <SheetTitle>Más Opciones</SheetTitle>
                    <SheetDescription>Navegue a otras secciones de la aplicación.</SheetDescription>
                </SheetHeader>
                <div className="grid grid-cols-1 gap-1">
                {moreNavItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMoreMenuOpen(false)}
                        className="flex items-center gap-4 p-3 -mx-3 rounded-lg text-foreground"
                    >
                        <item.icon className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">{item.label}</span>
                    </Link>
                ))}
                </div>
            </SheetContent>
      </Sheet>
    )
}


export function BottomNav() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const { currentUserProfile } = useAppContext();
  const isAdminLevel = ['Admin', 'Director', 'Subdirector', 'Coordinador'].includes(currentUserProfile?.role || '');
  
  const mainNavItems = useMemo(() => {
    const baseItems = [
      { href: "/dashboard", icon: LayoutGrid, label: "Panel" },
      { href: "/students", icon: Users, label: "Alumnos" },
      { href: "/incidents", icon: AlertTriangle, label: "Incidentes" },
    ];
    
    // Para usuarios administrativos, agregar el menú Personal
     if (isAdminLevel) {
       baseItems.push({ href: "/docentes", icon: UserCheck, label: "Personal" });
     }
    
    return baseItems;
  }, [isAdminLevel]);
  
  useEffect(() => {
    const controlNavbar = () => {
        if (typeof window !== 'undefined') { 
            const currentScrollY = window.scrollY;
            const scrollDifference = Math.abs(currentScrollY - lastScrollY);
            
            // Always show navbar when at the top of the page
            if (currentScrollY <= 20) {
                setIsVisible(true);
            }
            // Hide navbar only when scrolling down significantly and past 100px
            else if (currentScrollY > lastScrollY && currentScrollY > 100 && scrollDifference > 10) {
                setIsVisible(false);
            }
            // Show navbar when scrolling up with minimal movement
            else if (currentScrollY < lastScrollY && scrollDifference > 5) {
                setIsVisible(true);
            }
            
            setLastScrollY(currentScrollY); 
        }
    };

    if (typeof window !== 'undefined') {
        window.addEventListener('scroll', controlNavbar, { passive: true });
        return () => {
            window.removeEventListener('scroll', controlNavbar);
        };
    }
  }, [lastScrollY]);

  return (
    <div className={cn(
        "fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t md:hidden",
        isVisible ? "translate-y-0" : "translate-y-full"
    )}>
      <div className={cn(
        "grid h-full max-w-lg mx-auto font-medium",
        mainNavItems.length === 3 ? "grid-cols-5" : "grid-cols-6"
      )}>
        {mainNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex flex-col items-center justify-center px-2 text-center group",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="w-5 h-5 mb-1" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
        <UserProfileSheet />
        <MoreMenuSheet />
      </div>
    </div>
  );
}

    

    