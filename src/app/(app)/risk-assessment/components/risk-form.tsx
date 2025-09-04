
"use client";

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { RiskFactor, Student } from '@/core/domain/types';
import { StudentSearchModal } from '@/components/organisms/student-search-modal';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { StudentSummaryCard } from '@/components/organisms/student-summary-card';

const riskSchema = z.object({
  id: z.string().optional(),
  studentId: z.string().min(1, "Debe seleccionar un estudiante."),
  studentName: z.string().min(1, "Debe seleccionar un estudiante."),
  category: z.enum(['Attendance', 'Academic Performance', 'Family Situation']),
  level: z.enum(['Low', 'Medium', 'High']),
  notes: z.string().min(1, "Las notas son obligatorias."),
});

export type RiskFormValues = z.infer<typeof riskSchema>;

type RiskFormProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (risk: RiskFormValues) => void;
  risk?: RiskFactor;
};

export function RiskForm({ isOpen, onOpenChange, onSave, risk }: RiskFormProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  const form = useForm<RiskFormValues>({
    resolver: zodResolver(riskSchema),
    defaultValues: risk || { studentId: '', studentName: '', category: 'Attendance', level: 'Low', notes: '' },
  });
  
  useEffect(() => {
    if (risk) {
      form.reset(risk);
      setSelectedStudent({ name: risk.studentName } as Student);
    } else {
      form.reset({ studentId: '', studentName: '', category: 'Attendance', level: 'Low', notes: '' });
      setSelectedStudent(null);
    }
  }, [risk, form, isOpen]);


  const onSubmit = (data: RiskFormValues) => {
    onSave(data);
  };
  
  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    form.setValue('studentName', student.name, { shouldValidate: true });
    form.setValue('studentId', student.id, { shouldValidate: true });
    setIsModalOpen(false);
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{risk ? 'Editar Factor de Riesgo' : 'Añadir Nuevo Factor de Riesgo'}</DialogTitle>
          <DialogDescription>
            {risk ? 'Actualizar los detalles del factor de riesgo.' : 'Introduzca los detalles para un nuevo factor de riesgo.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            {!risk && (
                 <FormField
                    control={form.control}
                    name="studentName"
                    render={() => (
                        <FormItem>
                            <FormLabel>Estudiante</FormLabel>
                            <FormControl>
                                <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    readOnly
                                    onClick={() => setIsModalOpen(true)}
                                    value={selectedStudent ? selectedStudent.name : ''}
                                    placeholder="Buscar estudiante..."
                                    className="w-full cursor-pointer rounded-lg bg-background pl-8"
                                />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}
            
            {selectedStudent && <StudentSummaryCard student={selectedStudent} />}

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione una categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Attendance">Asistencia</SelectItem>
                      <SelectItem value="Academic Performance">Rendimiento Académico</SelectItem>
                      <SelectItem value="Family Situation">Situación Familiar</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nivel de Riesgo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un nivel" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Low">Bajo</SelectItem>
                      <SelectItem value="Medium">Medio</SelectItem>
                      <SelectItem value="High">Alto</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Proporcione detalles y observaciones." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit">{risk ? 'Guardar Cambios' : 'Añadir Factor de Riesgo'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    <StudentSearchModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSelectStudent={handleSelectStudent}
    />
    </>
  );
}

    