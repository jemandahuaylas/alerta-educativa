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
import type { Incident, Student } from '@/core/domain/types';
import { useIncidents } from '@/hooks/use-incidents';
import { Search } from 'lucide-react';
import { StudentSearchModal } from '@/components/organisms/student-search-modal';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/page-header';
import { StudentSummaryCard } from '@/components/organisms/student-summary-card';
import { useToast } from '@/hooks/use-toast';

const incidentSchema = z.object({
  studentName: z.string().min(1, "Debe seleccionar un estudiante."),
  studentId: z.string().min(1, "Debe seleccionar un estudiante."),
  incidentTypes: z.array(z.string()).min(1, "Debe seleccionar al menos un tipo de incidente."),
  otherIncident: z.string().optional(),
}).refine(data => {
    if (data.incidentTypes.includes('Otro') && !data.otherIncident?.trim()) {
        return false;
    }
    return true;
}, {
    message: "Por favor, describa el incidente en el campo 'Otro'.",
    path: ['otherIncident'],
});


type IncidentFormValues = z.infer<typeof incidentSchema>;

export default function IncidentFormPage() {
  const router = useRouter();
  const { addIncident, incidentTypes } = useIncidents();
  const { toast } = useToast();
  
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const form = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentSchema),
    defaultValues: { studentName: '', studentId: '', incidentTypes: [], otherIncident: '' },
  });

  const onSubmit = async (data: IncidentFormValues) => {
    const finalIncidentTypes = data.incidentTypes.includes('Otro')
        ? [...data.incidentTypes.filter(i => i !== 'Otro'), data.otherIncident!.trim()]
        : data.incidentTypes;

    const newIncident: Omit<Incident, 'id' | 'studentName' | 'status' | 'followUpNotes' | 'registeredBy' | 'attendedBy' | 'attendedDate'> = {
      studentId: data.studentId,
      date: new Date().toISOString().split('T')[0],
      incidentTypes: finalIncidentTypes,
    };
    await addIncident(newIncident);
    toast({
        title: "Registro Exitoso",
        description: `El incidente para ${data.studentName} ha sido guardado.`,
    });
    router.push('/incidents');
  };
  
  const selectedIncidentTypes = form.watch('incidentTypes');

  const handleIncidentToggle = (incident: string) => {
     const currentSelection = form.getValues('incidentTypes');
     const newSelection = currentSelection.includes(incident)
        ? currentSelection.filter(item => item !== incident)
        : [...currentSelection, incident];
    form.setValue('incidentTypes', newSelection, { shouldValidate: true });
  }

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    form.setValue('studentName', student.name, { shouldValidate: true });
    form.setValue('studentId', student.id, { shouldValidate: true });
    setIsModalOpen(false);
  }

  return (
    <>
      <PageHeader
        title="Registrar Nuevo Incidente"
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
                        <CardDescription>Busque y elija al estudiante involucrado en el incidente.</CardDescription>
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
                        <CardTitle>Detalles del Incidente</CardTitle>
                        <CardDescription>Seleccione el tipo o tipos de incidente a registrar.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <FormField
                control={form.control}
                name="incidentTypes"
                render={() => (
                    <FormItem>
                    <FormControl>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {[...incidentTypes, 'Otro'].map((incident) => (
                                <Button
                                    key={incident}
                                    type="button"
                                    variant={selectedIncidentTypes.includes(incident) ? "default" : "outline"}
                                    onClick={() => handleIncidentToggle(incident)}
                                    className="h-auto py-3 whitespace-normal text-center"
                                >
                                    {incident}
                                </Button>
                            ))}
                        </div>
                    </FormControl>
                    {selectedIncidentTypes.includes('Otro') && (
                        <FormField
                            control={form.control}
                            name="otherIncident"
                            render={({ field }) => (
                                <FormItem className="mt-2">
                                    <FormControl>
                                        <Textarea
                                        placeholder="Describa el incidente..."
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
            </CardContent>
            </Card>
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
                <Button type="submit">Registrar Incidente</Button>
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
