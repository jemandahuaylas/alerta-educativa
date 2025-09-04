"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import type { Dropout, Student } from '@/core/domain/types';
import { useDesertion } from '@/hooks/use-desertion';
import { Search } from 'lucide-react';
import { StudentSearchModal } from '@/components/organisms/student-search-modal';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/page-header';
import { StudentSummaryCard } from '@/components/organisms/student-summary-card';
import { useToast } from '@/hooks/use-toast';

const dropoutSchema = z.object({
  studentName: z.string().min(1, "Debe seleccionar un estudiante."),
  studentId: z.string().min(1, "Debe seleccionar un estudiante."),
  dropoutDate: z.date({
    required_error: "La fecha de deserción es obligatoria.",
  }),
  reason: z.string().min(1, "Debe seleccionar una razón."),
  otherReason: z.string().optional(),
  notes: z.string().min(1, "Las notas son obligatorias."),
}).refine(data => {
    if (data.reason === 'Otro' && !data.otherReason?.trim()) {
        return false;
    }
    return true;
}, {
    message: "Por favor, especifique la razón en el campo 'Otro'.",
    path: ['otherReason'],
});

type DropoutFormValues = z.infer<typeof dropoutSchema>;

export default function NewDesertionPage() {
  const router = useRouter();
  const { dropoutReasons, addDropout } = useDesertion();
  const { toast } = useToast();
  
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const form = useForm<DropoutFormValues>({
    resolver: zodResolver(dropoutSchema),
    defaultValues: { studentName: '', studentId: '', reason: '', otherReason: '', notes: '' },
  });

  const onSubmit = async (data: DropoutFormValues) => {
    const finalReason = data.reason === 'Otro' ? data.otherReason! : data.reason;

    const newDropout: Omit<Dropout, 'id' | 'studentName'> = {
      studentId: data.studentId,
      dropoutDate: data.dropoutDate.toISOString().split('T')[0],
      reason: finalReason,
      notes: data.notes
    };
    await addDropout(newDropout);
    
    toast({
        title: "Registro Exitoso",
        description: `El registro de deserción para ${data.studentName} ha sido guardado.`,
    });

    router.push('/desertion');
  };

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    form.setValue('studentName', student.name, { shouldValidate: true });
    form.setValue('studentId', student.id, { shouldValidate: true });
    setIsModalOpen(false);
  }

  const selectedReason = form.watch('reason');

  const handleReasonToggle = (reason: string) => {
    const currentSelection = form.getValues('reason');
    const newSelection = currentSelection === reason ? "" : reason;
    form.setValue('reason', newSelection, { shouldValidate: true });
  }


  return (
    <>
      <PageHeader
        title="Añadir Nuevo Registro de Deserción"
      />
      <div>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold shrink-0">1</div>
                    <div>
                        <CardTitle>Seleccionar Estudiante</CardTitle>
                        <CardDescription>Busque y elija al estudiante que será registrado.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <FormField
                control={form.control}
                name="studentName"
                render={() => (
                    <FormItem>
                    <FormControl>
                        <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            readOnly
                            onClick={() => setIsModalOpen(true)}
                            value={selectedStudent ? selectedStudent.name : ''}
                            placeholder="Buscar estudiante por nombre o DNI..."
                            className="w-full cursor-pointer rounded-lg bg-background pl-8"
                        />
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </CardContent>
            </Card>

            {selectedStudent && <StudentSummaryCard student={selectedStudent} />}

            <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold shrink-0">2</div>
                    <div>
                        <CardTitle>Detalles de la Deserción</CardTitle>
                        <CardDescription>Proporcione la información relevante sobre la deserción.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField
                control={form.control}
                name="dropoutDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Deserción</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            {field.value ? (
                                format(field.value, "PPP", { locale: es })
                            ) : (
                                <span>Seleccione una fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="reason"
                render={() => (
                    <FormItem>
                    <FormLabel>Razón</FormLabel>
                    <FormControl>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {[...dropoutReasons, 'Otro'].map((reason) => (
                                <Button
                                    key={reason}
                                    type="button"
                                    variant={selectedReason === reason ? "default" : "outline"}
                                    onClick={() => handleReasonToggle(reason)}
                                    className="h-auto py-3 whitespace-normal text-center"
                                >
                                    {reason}
                                </Button>
                            ))}
                        </div>
                    </FormControl>
                    {selectedReason === 'Otro' && (
                        <FormField
                            control={form.control}
                            name="otherReason"
                            render={({ field }) => (
                                <FormItem className="mt-2">
                                    <FormControl>
                                        <Input
                                            placeholder="Especifique la razón..."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Notas Adicionales</FormLabel>
                    <FormControl>
                        <Textarea placeholder="Proporcione detalles sobre la razón de la deserción." {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </CardContent>
            </Card>
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
                <Button type="submit">Añadir Registro</Button>
            </div>
        </form>
        </Form>
      </div>
      <StudentSearchModal
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          onSelectStudent={handleSelectStudent}
      />
    </>
  );
}
