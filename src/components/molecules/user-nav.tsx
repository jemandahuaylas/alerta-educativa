
"use client";

import { useRouter } from "next/navigation";
import {
  ResponsiveDropdownMenu,
  ResponsiveDropdownMenuContent,
  ResponsiveDropdownMenuItem,
  ResponsiveDropdownMenuLabel,
  ResponsiveDropdownMenuSeparator,
  ResponsiveDropdownMenuTrigger,
} from "@/components/ui/responsive-dropdown-menu";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { useSidebar } from "../ui/sidebar";
import { useAppContext } from "@/context/app-context";
import * as authService from "@/core/services/auth-service";
import { Avatar, AvatarFallback } from "../ui/avatar";

export function UserNav() {
    const { open } = useSidebar();
    const { session, setSession, currentUserProfile } = useAppContext();
    const router = useRouter();

    const handleSignOut = async () => {
        await authService.signOut();
        setSession(null);
        router.push('/login');
    };
    
    const isAdminLevel = ['Admin', 'Director', 'Subdirector', 'Coordinador'].includes(currentUserProfile?.role || '');
    
    return (
      <ResponsiveDropdownMenu>
        <ResponsiveDropdownMenuTrigger asChild>
           {open ? (
              <Button variant="ghost" className="w-full justify-start items-center gap-3 p-2 h-auto">
                 <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                      {currentUserProfile?.name?.charAt(0) ?? 'U'}
                    </AvatarFallback>
                 </Avatar>
                 <div className="flex flex-col items-start truncate">
                    <span className="text-sm font-semibold truncate text-foreground">{currentUserProfile?.name ?? 'Usuario'}</span>
                    <span className="text-xs text-muted-foreground truncate">{currentUserProfile?.role}</span>
                 </div>
              </Button>
           ) : (
             <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                   <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                      {currentUserProfile?.name?.charAt(0) ?? 'U'}
                    </AvatarFallback>
                </Avatar>
                <span className="sr-only">Menú de usuario</span>
             </Button>
           )}
        </ResponsiveDropdownMenuTrigger>
        <ResponsiveDropdownMenuContent align="end" className="w-56">
          <ResponsiveDropdownMenuLabel>
              <p className="font-semibold">{currentUserProfile?.name ?? 'Usuario'}</p>
              <p className="text-xs text-muted-foreground font-normal truncate">{session?.user?.email}</p>
          </ResponsiveDropdownMenuLabel>
          <ResponsiveDropdownMenuSeparator />
          {isAdminLevel && (
              <ResponsiveDropdownMenuItem onSelect={() => router.push('/settings')}>Configuración</ResponsiveDropdownMenuItem>
          )}
          <ResponsiveDropdownMenuItem>Soporte</ResponsiveDropdownMenuItem>
          <ResponsiveDropdownMenuSeparator />
          <ResponsiveDropdownMenuItem onSelect={handleSignOut} className="text-destructive">Cerrar Sesión</ResponsiveDropdownMenuItem>
        </ResponsiveDropdownMenuContent>
      </ResponsiveDropdownMenu>
    );
}
