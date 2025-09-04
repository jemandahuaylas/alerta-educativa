
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { School } from 'lucide-react';
import { PasswordInput } from '@/components/ui/password-input';
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/use-settings";
import { useAppContext } from "@/context/app-context";
import { useKeyboardScrollViewport } from "@/hooks/use-keyboard-scroll";
import * as authService from '@/core/services/auth-service';
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { settings } = useSettings();
  const { setSession } = useAppContext();
  const containerRef = useKeyboardScrollViewport();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const session = await authService.signIn(email, password);
      if (session) {
        // Esperar un momento para que el estado se sincronice
        await new Promise(resolve => setTimeout(resolve, 100));
        
        setSession(session);
        toast({ title: "Inicio de sesión exitoso", description: "Bienvenido(a), redirigiendo al panel..." });
        
        // Esperar un poco más antes de redirigir para asegurar que el estado esté actualizado
        setTimeout(() => {
          router.push('/dashboard');
        }, 200);
      } else {
         throw new Error("No se pudo iniciar sesión. Por favor, compruebe sus credenciales.");
      }
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error de inicio de sesión",
        description: error instanceof Error ? error.message : "Credenciales incorrectas.",
      });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="w-full max-w-md mx-auto p-4">
        <div className="flex flex-col items-center justify-center text-center mb-6">
            <div className="mb-4">
                {settings.logoUrl ? (
                    <Image 
                        src={settings.logoUrl} 
                        alt={`${settings.appName} Logo`}
                        width={64}
                        height={64}
                        className="h-16 w-16 rounded-lg object-contain"
                    />
                ) : (
                    <div className="bg-primary rounded-lg p-2 flex items-center justify-center h-16 w-16">
                        <School className="w-8 h-8 text-primary-foreground" />
                    </div>
                )}
            </div>
            <h1 className="text-2xl font-bold text-foreground">{settings.appName}</h1>
            <p className="text-muted-foreground">{settings.institutionName}</p>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>
            Bienvenido(a)
          </CardTitle>
          <CardDescription>
            Ingrese su correo electrónico y contraseña para acceder.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="su.correo@example.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <PasswordInput 
                id="password" 
                placeholder="Su contraseña"
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
             <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>
           {settings?.isRegistrationEnabled && (
            <div className="mt-4 text-center text-sm">
              ¿Aún no tienes una cuenta?{" "}
              <Link href="/signup" className="underline">
                Regístrate
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
