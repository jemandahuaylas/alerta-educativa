
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { School, Loader2 } from "lucide-react";
import { PasswordInput } from '@/components/ui/password-input';
import { useSettings } from '@/hooks/use-settings';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useKeyboardScrollViewport } from '@/hooks/use-keyboard-scroll';
import * as authService from '@/core/services/auth-service';
import Image from "next/image";

const signupSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio."),
  email: z.string().email("Dirección de correo electrónico no válida."),
  role: z.enum(['Admin', 'Director', 'Subdirector', 'Coordinador'], {
      required_error: "Debe seleccionar un rol."
  }),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { settings } = useSettings();
  const router = useRouter();
  const { toast } = useToast();
  const containerRef = useKeyboardScrollViewport();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', role: undefined, password: '' },
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    try {
        await authService.signUp(data);
        toast({
            title: "¡Registro Exitoso!",
            description: "Su cuenta ha sido creada. Por favor, inicie sesión.",
        });
        router.push('/login');
    } catch (error) {
        let description = "Ocurrió un error inesperado.";
        if (error instanceof Error) {
            if (error.message.includes('violates row-level security policy')) {
                description = "El registro de nuevos usuarios está actualmente deshabilitado por el administrador.";
            } else {
                description = error.message;
            }
        }
        toast({
            variant: "destructive",
            title: "Error en el Registro",
            description: description,
        });
    } finally {
        setIsLoading(false);
    }
  };


  useEffect(() => {
    // The settings object can be null initially while loading
    if (settings) {
      if (!settings.isRegistrationEnabled) {
        router.replace('/login');
      } else {
        setIsLoadingSettings(false);
      }
    }
  }, [settings, router]);

  if (isLoadingSettings) {
    return (
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

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
          <CardTitle>Crear una Cuenta de Administrador</CardTitle>
          <CardDescription>
            Complete el formulario para registrar un nuevo perfil administrativo.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nombre Completo</FormLabel>
                        <FormControl>
                            <Input placeholder="p. ej. Juan Pérez" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Correo Electrónico</FormLabel>
                        <FormControl>
                            <Input type="email" placeholder="m@example.com" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Rol</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione un rol" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Director">Director</SelectItem>
                                <SelectItem value="Subdirector">Subdirector</SelectItem>
                                <SelectItem value="Coordinador">Coordinador</SelectItem>
                                <SelectItem value="Admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Contraseña</FormLabel>
                        <FormControl>
                            <PasswordInput {...field} disabled={isLoading} placeholder="Mínimo 6 caracteres" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
                </Button>
            </form>
           </Form>
          <div className="mt-4 text-center text-sm">
            ¿Ya tiene una cuenta?{" "}
            <Link href="/login" className="underline">
              Iniciar Sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
