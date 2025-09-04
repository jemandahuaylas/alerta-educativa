
"use client";

import Link from "next/link";
import { School } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useSettings } from "@/hooks/use-settings";
import Image from "next/image";

export function Brand() {
  const { open } = useSidebar();
  const { settings } = useSettings();

  return (
    <Link href="/dashboard" className="flex items-center gap-2.5 group-data-[state=collapsed]/sidebar-wrapper:justify-center">
      {settings.logoUrl ? (
        <Image 
          src={settings.logoUrl} 
          alt={`${settings.appName} Logo`}
          width={40}
          height={40}
          className="h-10 w-10 rounded-lg object-contain"
        />
      ) : (
        <div className="bg-primary rounded-lg p-2 flex items-center justify-center h-10 w-10">
          <School className="w-6 h-6 text-primary-foreground" />
        </div>
      )}
      {open && <h1 className="text-xl font-bold text-foreground">{settings.appName}</h1>}
    </Link>
  );
}
