
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
import type { Student } from '@/core/domain/types';

const studentSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres."),
  dni: z.string()
    .length(8, "El DNI debe tener exactamente 8 dígitos.")
    .regex(/^\d+$/, "El DNI solo puede contener números."),
});

export type StudentFormValues = z.infer<typeof studentSchema>;


type StudentFormProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (student: StudentFormValues) => void;
  student?: Student;
};

export function StudentForm({ isOpen, onOpenChange, onSave, student }: StudentFormProps) {
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: student ? {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        dni: student.dni,
    } : { firstName: '', lastName: '', dni: '' },
  });

  useEffect(() => {
     form.reset(student ? {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        dni: student.dni,
    } : { firstName: '', lastName: '', dni: '' });
  }, [student, form]);

  const onSubmit = (data: StudentFormValues) => {
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
          <ResponsiveDialogTitle>{student ? 'Editar Estudiante' : 'Añadir Nuevo Estudiante'}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {student ? 'Actualice los detalles del estudiante.' : 'Introduzca los detalles del nuevo estudiante.'}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombres</FormLabel>
                  <FormControl>
                    <Input placeholder="p. ej. Ana" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellidos</FormLabel>
                  <FormControl>
                    <Input placeholder="p. ej. García" {...field} />
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
            <ResponsiveDialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit">{student ? 'Guardar Cambios' : 'Añadir Estudiante'}</Button>
            </ResponsiveDialogFooter>
          </form>
        </Form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
