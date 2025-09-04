
"use client";

import { useMemo } from 'react';
import Link from "next/link";
import { usePathname } from 'next/navigation';
import {
  AlertTriangle,
  ClipboardList,
  HeartPulse,
  LayoutGrid,
  Settings,
  ShieldCheck,
  TrendingDown,
  UserCheck,
  Users,
} from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
  SidebarSeparator,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { useAppContext } from '@/context/app-context';
import { cn } from '@/lib/utils';

export const navItems = [
  {
    title: 'General',
    items: [
      { href: "/dashboard", icon: LayoutGrid, label: "Panel de Control" },
      { href: "/students", icon: Users, label: "Estudiantes" },
    ]
  },
  {
    title: 'Seguimiento',
    items: [
      { href: "/incidents", icon: AlertTriangle, label: "Incidentes" },
      { href: "/permisos", icon: ShieldCheck, label: "Permisos" },
      { href: "/nee", icon: ClipboardList, label: "Estudiantes con NEE" },
      { href: "/risk-assessment", icon: HeartPulse, label: "Evaluación de Riesgos" },
      { href: "/desertion", icon: TrendingDown, label: "Seguimiento de Deserción" },
    ]
  },
];

const managementNavItems = [
    { href: "/docentes", icon: UserCheck, label: "Personal" },
];

export const settingsNavItem = { href: "/settings", icon: Settings, label: "Ajustes" };

export function MainNav() {
  const pathname = usePathname();
  const { currentUserProfile } = useAppContext();
  const { open } = useSidebar();
  
  const isRestrictedUser = currentUserProfile?.role === 'Docente' || currentUserProfile?.role === 'Auxiliar';
  const isAdminLevel = ['Admin', 'Director', 'Subdirector', 'Coordinador'].includes(currentUserProfile?.role || '');

  const availableNavGroups = useMemo(() => {
    if (isRestrictedUser) {
      const allowedHrefs = ["/dashboard", "/students", "/incidents", "/permisos", "/nee"];
      return navItems.map(group => ({
        ...group,
        items: group.items.filter(item => allowedHrefs.includes(item.href)),
      })).filter(group => group.items.length > 0);
    }
    return navItems;
  }, [isRestrictedUser]);

  return (
    <SidebarMenu>
      {availableNavGroups.map((group, groupIndex) => (
        <SidebarMenuItem key={group.title}>
          {open && <SidebarGroupLabel>{group.title}</SidebarGroupLabel>}
          {group.items.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <SidebarMenuButton
                  key={item.href}
                  asChild
                  tooltip={item.label}
                  variant="default"
                  className={cn(
                    "relative",
                    isActive && "before:absolute before:left-0 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-r-md before:bg-primary"
                  )}
                  isActive={isActive}
              >
                  <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                  </Link>
              </SidebarMenuButton>
            )
          })}
          {groupIndex < availableNavGroups.length - 1 && <SidebarSeparator className="my-2" />}
        </SidebarMenuItem>
      ))}

      {!isRestrictedUser && (
        <>
            <SidebarMenuItem>
              {open && <SidebarGroupLabel>Administración</SidebarGroupLabel>}
              {managementNavItems.map(item => {
                const isActive = pathname.startsWith(item.href);
                return (
                 <SidebarMenuButton
                    key={item.href}
                    asChild
                    tooltip={item.label}
                    variant="default"
                    isActive={isActive}
                    className={cn(
                      "relative",
                      isActive && "before:absolute before:left-0 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-r-md before:bg-primary"
                    )}
                  >
                  <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                  </Link>
                  </SidebarMenuButton>
                )
              })}
              <SidebarSeparator className="my-2" />
            </SidebarMenuItem>
        </>
      )}

      {isAdminLevel && (
         <SidebarMenuItem>
           {(() => {
              const isActive = pathname.startsWith(settingsNavItem.href);
              return (
                <SidebarMenuButton
                  asChild
                  tooltip={settingsNavItem.label}
                  variant="default"
                  isActive={isActive}
                  className={cn(
                    "relative",
                    isActive && "before:absolute before:left-0 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-r-md before:bg-primary"
                  )}
                >
                  <Link href={settingsNavItem.href}>
                      <settingsNavItem.icon />
                      <span>{settingsNavItem.label}</span>
                  </Link>
                </SidebarMenuButton>
              )
            })()}
        </SidebarMenuItem>
      )}
    </SidebarMenu>
  );
}
