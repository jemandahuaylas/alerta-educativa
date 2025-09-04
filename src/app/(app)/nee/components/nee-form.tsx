"use client";

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { NEE } from '@/core/domain/types';
import { useStudents } from '@/hooks/use-students';

const neeSchema = z.object({
  id: z.string().optional(),
  studentName: z.string().min(1, "El nombre del estudiante es obligatorio."),
  diagnosis: z.string().min(1, "El diagnóstico es obligatorio."),
  evaluationDate: z.string().min(1, "La fecha de evaluación es obligatoria."),
  supportPlan: z.string().min(1, "El plan de apoyo es obligatorio."),
});

type NeeFormValues = z.infer<typeof neeSchema>;

type NeeFormProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (nee: NEE) => void;
  nee?: NEE;
};

export function NeeForm({ isOpen, onOpenChange, onSave, nee }: NeeFormProps) {
  const { students } = useStudents();
  const form = useForm<NeeFormValues>({
    resolver: zodResolver(neeSchema),
    defaultValues: nee ? {
      ...nee,
      supportPlan: nee.supportPlan || ''
    } : { studentName: '', diagnosis: '', evaluationDate: '', supportPlan: '' },
  });

  useEffect(() => {
    form.reset(nee ? {
      ...nee,
      supportPlan: nee.supportPlan || ''
    } : { studentName: '', diagnosis: '', evaluationDate: '', supportPlan: '' });
  }, [nee, form]);

  const onSubmit = (data: NeeFormValues) => {
    onSave(data as NEE);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{nee ? 'Editar Registro NEE' : 'Añadir Nuevo Registro NEE'}</DialogTitle>
          <DialogDescription>
            {nee ? 'Actualice los detalles del registro.' : 'Introduzca los detalles para un nuevo registro.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
              control={form.control}
              name="studentName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estudiante</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un estudiante" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {students.map(student => (
                        <SelectItem key={student.id} value={student.name}>{student.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="diagnosis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diagnóstico</FormLabel>
                  <FormControl>
                    <Input placeholder="p. ej. Dislexia, TDAH" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="evaluationDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Evaluación</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="supportPlan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan de Apoyo</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describa el plan de apoyo para el estudiante." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit">{nee ? 'Guardar Cambios' : 'Añadir Registro'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
