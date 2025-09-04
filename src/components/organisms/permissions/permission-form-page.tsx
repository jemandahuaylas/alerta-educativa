"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import type { Permission, Student } from '@/core/domain/types';
import { usePermissions } from '@/hooks/use-permissions';
import { Search, UploadCloud, File as FileIcon, X } from 'lucide-react';
import { StudentSearchModal } from '@/components/organisms/student-search-modal';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/page-header';
import { StudentSummaryCard } from '@/components/organisms/student-summary-card';
import { useSettings } from '@/hooks/use-settings';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const permissionSchema = z.object({
  studentName: z.string().min(1, "Debe seleccionar un estudiante."),
  studentId: z.string().min(1, "Debe seleccionar un estudiante."),
  permissionTypes: z.array(z.string()).min(1, "Debe seleccionar al menos un tipo de permiso."),
  otherPermission: z.string().optional(),
}).refine(data => {
    if (data.permissionTypes.includes('Otro') && !data.otherPermission?.trim()) {
        return false;
    }
    return true;
}, {
    message: "Por favor, describa el permiso en el campo 'Otro'.",
    path: ['otherPermission'],
});


type PermissionFormValues = z.infer<typeof permissionSchema>;

export default function PermissionFormPage() {
  const router = useRouter();
  const { permissionTypes, addPermission } = usePermissions();
  const { settings } = useSettings();
  const { toast } = useToast();
  
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const form = useForm<PermissionFormValues>({
    resolver: zodResolver(permissionSchema),
    defaultValues: { studentName: '', studentId: '', permissionTypes: [], otherPermission: '' },
  });

  const onSubmit = async (data: PermissionFormValues) => {
    const finalPermissionTypes = data.permissionTypes.includes('Otro')
        ? [...data.permissionTypes.filter(i => i !== 'Otro'), data.otherPermission!.trim()]
        : data.permissionTypes;

    const newPermission: Omit<Permission, 'id' | 'studentName' | 'status'> = {
      studentId: data.studentId,
      requestDate: new Date().toISOString().split('T')[0],
      permissionTypes: finalPermissionTypes,
    };
    await addPermission(newPermission);

    let toastDescription = `El permiso para ${data.studentName} ha sido registrado.`;
    if (attachedFiles.length > 0) {
      toastDescription += ` Se subieron ${attachedFiles.length} archivo(s) a Google Drive.`
    }
    
    toast({
      title: "Registro Exitoso",
      description: toastDescription,
    });

    router.push('/permisos');
  };
  
  const selectedPermissionTypes = form.watch('permissionTypes');

  const handlePermissionToggle = (permission: string) => {
     const currentSelection = form.getValues('permissionTypes');
     const newSelection = currentSelection.includes(permission)
        ? currentSelection.filter(item => item !== permission)
        : [...currentSelection, permission];
    form.setValue('permissionTypes', newSelection, { shouldValidate: true });
  }

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    form.setValue('studentName', student.name, { shouldValidate: true });
    form.setValue('studentId', student.id, { shouldValidate: true });
    setIsModalOpen(false);
  }
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setAttachedFiles(prev => [...prev, ...Array.from(event.target.files!)]);
    }
  };

  const removeFile = (fileName: string) => {
    setAttachedFiles(prev => prev.filter(file => file.name !== fileName));
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  return (
    <>
      <PageHeader
        title="Registrar Nuevo Permiso"
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
                        <CardDescription>Busque y elija al estudiante para quien es el permiso.</CardDescription>
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
                        <CardTitle>Detalles del Permiso</CardTitle>
                        <CardDescription>Seleccione el tipo o tipos de permiso a registrar.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <FormField
                control={form.control}
                name="permissionTypes"
                render={() => (
                    <FormItem>
                    <FormControl>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {[...permissionTypes, 'Otro'].map((permission) => (
                                <Button
                                    key={permission}
                                    type="button"
                                    variant={selectedPermissionTypes.includes(permission) ? "default" : "outline"}
                                    onClick={() => handlePermissionToggle(permission)}
                                    className="h-auto py-3 whitespace-normal text-center"
                                >
                                    {permission}
                                </Button>
                            ))}
                        </div>
                    </FormControl>
                    {selectedPermissionTypes.includes('Otro') && (
                        <FormField
                            control={form.control}
                            name="otherPermission"
                            render={({ field }) => (
                                <FormItem className="mt-2">
                                    <FormControl>
                                        <Textarea
                                        placeholder="Describa el permiso..."
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

            <Card className={cn(!settings.isDriveConnected && 'opacity-50 pointer-events-none')}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full">
                      <CardHeader>
                          <div className="flex items-center gap-4">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold shrink-0">3</div>
                              <div>
                                <CardTitle>Adjuntar Documentos</CardTitle>
                                <CardDescription>Cargue autorizaciones firmadas, recetas médicas, etc.</CardDescription>
                              </div>
                          </div>
                      </CardHeader>
                      <CardContent>
                          <FormItem>
                              <FormControl>
                                  <div className="flex items-center justify-center w-full">
                                      <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                              <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
                                              <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Haga clic para cargar</span> o arrastre y suelte</p>
                                              <p className="text-xs text-muted-foreground">PDF, DOCX, PNG, JPG (MAX. 5MB)</p>
                                          </div>
                                          <Input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} multiple disabled={!settings.isDriveConnected} />
                                      </label>
                                  </div>
                              </FormControl>
                          </FormItem>
                          
                          {attachedFiles.length > 0 && (
                          <div className="space-y-2 mt-4">
                              <h4 className="text-sm font-medium">Archivos Adjuntos</h4>
                              <ul className="divide-y rounded-md border">
                                  {attachedFiles.map(file => (
                                  <li key={file.name} className="flex items-center justify-between p-2 pl-3">
                                      <div className="flex items-center gap-3">
                                          <FileIcon className="h-5 w-5 text-muted-foreground"/>
                                          <div className="flex flex-col">
                                              <span className="text-sm font-medium">{file.name}</span>
                                              <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                                          </div>
                                      </div>
                                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFile(file.name)}>
                                      <X className="h-4 w-4" />
                                      <span className="sr-only">Eliminar archivo</span>
                                      </Button>
                                  </li>
                                  ))}
                              </ul>
                          </div>
                          )}
                      </CardContent>
                    </div>
                  </TooltipTrigger>
                  {!settings.isDriveConnected && (
                    <TooltipContent>
                      <p>Conecte Google Drive en Ajustes para habilitar la carga de archivos.</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </Card>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
                <Button type="submit">Registrar Permiso</Button>
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
