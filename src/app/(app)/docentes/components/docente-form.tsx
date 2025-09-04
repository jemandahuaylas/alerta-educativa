
"use client";

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { UserProfile, UserProfileFormValues } from '@/core/domain/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const personnelSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "El nombre es obligatorio."),
  dni: z.string()
    .length(8, "El DNI debe tener exactamente 8 dígitos.")
    .regex(/^\d+$/, "El DNI solo puede contener números."),
  email: z.string().email("Dirección de correo electrónico no válida."),
  role: z.enum(['Docente', 'Auxiliar'], { required_error: "Debe seleccionar un rol."}),
  password: z.string().optional(),
});

export type PersonnelFormValues = z.infer<typeof personnelSchema>;


type DocenteFormProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (teacher: PersonnelFormValues) => void;
  teacher?: UserProfile;
};

export function DocenteForm({ isOpen, onOpenChange, onSave, teacher }: DocenteFormProps) {
  const form = useForm<PersonnelFormValues>({
    resolver: zodResolver(personnelSchema),
    defaultValues: teacher ? {
      id: teacher.id,
      name: teacher.name,
      dni: teacher.dni || '',
      email: teacher.email,
      role: (teacher.role === 'Docente' || teacher.role === 'Auxiliar') ? teacher.role : 'Docente',
      password: ''
    } : { name: '', dni: '', email: '', role: 'Docente', password: '' },
  });

  useEffect(() => {
    form.reset(teacher ? {
      id: teacher.id,
      name: teacher.name,
      dni: teacher.dni || '',
      email: teacher.email,
      role: (teacher.role === 'Docente' || teacher.role === 'Auxiliar') ? teacher.role : 'Docente',
      password: ''
    } : { name: '', dni: '', email: '', role: 'Docente', password: '' });
  }, [teacher, isOpen, form]);

  const onSubmit = (data: PersonnelFormValues) => {
    onSave(data);
  };
  
  return (
    <ResponsiveDialog open={isOpen} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent 
        className="sm:max-w-[425px]"
        onOpenAutoFocus={(e) => {
            e.preventDefault();
            const formElement = e.currentTarget as HTMLElement;
            const firstInput = formElement.querySelector('input');
            firstInput?.focus();
        }}
      >
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{teacher ? 'Editar Personal' : 'Añadir Nuevo Personal'}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {teacher ? 'Actualice los detalles.' : 'La contraseña inicial será el número de DNI.'}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="p. ej. Carlos Sánchez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="dni"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DNI</FormLabel>
                  <FormControl>
                    <Input placeholder="p. ej. 12345678" {...field} />
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
                    <Input type="email" placeholder="p. ej. carlos.s@example.com" {...field} />
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                      <SelectTrigger>
                          <SelectValue placeholder="Seleccione un rol" />
                      </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                          <SelectItem value="Docente">Docente</SelectItem>
                          <SelectItem value="Auxiliar">Auxiliar</SelectItem>
                      </SelectContent>
                  </Select>
                  <FormMessage />
                  </FormItem>
              )}
            />
            <ResponsiveDialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit">{teacher ? 'Guardar Cambios' : 'Crear Personal'}</Button>
            </ResponsiveDialogFooter>
          </form>
        </Form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
