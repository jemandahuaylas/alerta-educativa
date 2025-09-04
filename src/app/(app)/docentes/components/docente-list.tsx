
"use client";

import { useState, useEffect, useMemo } from 'react';
import { PlusCircle, FileUp, Search } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { UserProfile, UserProfileFormValues } from '@/core/domain/types';
import type { PersonnelFormValues } from './docente-form';
import { useAppContext } from '@/context/app-context';
import { DocenteForm } from './docente-form';
import { ImportDocentesModal } from './import-docentes-modal';
import ResourceListView from '@/components/organisms/resource-list-view';
import { PersonnelListCard } from './personnel-list-card';
import { PersonnelGridCard } from './personnel-grid-card';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TeacherDetailsModal } from './teacher-details-modal';
import { usePersonnel } from '@/hooks/use-teachers';
import { useGradesAndSections } from '@/hooks/use-grades-and-sections';

export default function DocenteList() {
  const { personnel, assignments } = usePersonnel();
  const { grades } = useGradesAndSections();
  const { editProfile, deleteProfile, addProfile, profiles, refreshProfiles } = useAppContext();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState<UserProfile | undefined>(undefined);
  const [personnelToDelete, setPersonnelToDelete] = useState<UserProfile | null>(null);
  const [personnelToView, setPersonnelToView] = useState<UserProfile | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleAdd = () => {
    setSelectedPersonnel(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (person: UserProfile) => {
    setSelectedPersonnel(person);
    setIsFormOpen(true);
  };

  const handleViewDetails = (person: UserProfile) => {
    setPersonnelToView(person);
    setIsDetailsModalOpen(true);
  };

  const handleSave = async (personnelData: PersonnelFormValues) => {
    try {
        if (personnelData.id) {
            await editProfile(personnelData.id, personnelData);
            toast({ title: "Personal Actualizado", description: "Los datos del personal han sido actualizados." });
        } else {
            const dataToSave = {
              ...personnelData,
              password: personnelData.dni,
            };
            await addProfile(dataToSave);
            toast({ title: "Personal Creado", description: "El nuevo miembro del personal ha sido añadido y tiene acceso al sistema." });
        }
        setIsFormOpen(false);
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error al guardar",
            description: error instanceof Error ? error.message : "No se pudo guardar el registro.",
        });
    }
  };

  const handleImport = async (newPersonnel: Omit<UserProfile, 'id'>[]) => {
    try {
      let importedCount = 0;
      let skippedCount = 0;
      
      for (const person of newPersonnel) {
        try {
          // Check if user already exists by email
          const existingUser = personnel.find(p => p.email.toLowerCase() === person.email.toLowerCase());
          
          if (existingUser) {
            console.log(`User with email ${person.email} already exists, skipping...`);
            skippedCount++;
            continue;
          }
          
          const dataToSave = {
            ...person,
            role: 'Docente' as const,
            password: person.dni || 'defaultpassword'
          };
          await addProfile(dataToSave, true);
          importedCount++;
        } catch (error) {
          console.error('Error importing teacher:', error);
          // Check if it's a duplicate user error
          if (error instanceof Error && error.message.includes('User already registered')) {
            console.log(`User ${person.email} already registered, skipping...`);
          }
          skippedCount++;
        }
      }
      
      // Refresh profiles after all imports are done
      await refreshProfiles();
      
      toast({
        title: "Importación Completada",
        description: `Se importaron ${importedCount} docentes correctamente. ${skippedCount > 0 ? `${skippedCount} registros fueron omitidos (usuarios duplicados o errores).` : ''}`
      });
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error en la importación",
        description: error instanceof Error ? error.message : "No se pudieron importar los docentes."
      });
    } finally {
      setIsImportModalOpen(false);
    }
  }
  
  const handleDeleteConfirm = async () => {
    if (personnelToDelete) {
        await deleteProfile(personnelToDelete.id);
        setPersonnelToDelete(null);
    }
  };

  const filteredPersonnel = personnel.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.dni ?? '').includes(searchQuery)
  );

  const personnelAssignments = useMemo(() => {
    const assignmentsMap = new Map<string, { gradeName: string; sectionName: string }[]>();
    assignments.forEach(({ teacher_id, grade_id, section_id }) => {
      const grade = grades.find(g => g.id === grade_id);
      const section = grade?.sections.find(s => s.id === section_id);
      if (grade && section) {
        if (!assignmentsMap.has(teacher_id)) {
          assignmentsMap.set(teacher_id, []);
        }
        assignmentsMap.get(teacher_id)!.push({ gradeName: grade.name, sectionName: section.name });
      }
    });
    return assignmentsMap;
  }, [assignments, grades]);

  
  return (
    <>
      <PageHeader
        title="Gestionar Personal"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
              <FileUp className="mr-2 h-4 w-4" />
              Importar
            </Button>
            <Button onClick={handleAdd}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Personal
            </Button>
          </div>
        }
      />
       <div className="mb-4">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre, correo o DNI..."
            className="w-full rounded-lg bg-background pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <ResourceListView
        items={filteredPersonnel}
        view="list"
        isLoading={!isClient}
        renderListItem={(person) => (
          <PersonnelListCard 
            item={person}
            onEdit={handleEdit}
            onDelete={setPersonnelToDelete}
            onViewDetails={handleViewDetails}
          />
        )}
        renderGridItem={(person) => (
          <PersonnelGridCard item={person} />
        )}
        noResultsMessage="No hay personal que coincida con su búsqueda."
        listClassName="space-y-2"
      />
      
      <DocenteForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSave}
        teacher={selectedPersonnel}
      />

      <ImportDocentesModal
        isOpen={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onImport={handleImport}
      />
      
      <TeacherDetailsModal
        isOpen={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        teacher={personnelToView}
        assignments={personnelToView ? personnelAssignments.get(personnelToView.id) || [] : []}
      />

      {personnelToDelete && (
        <AlertDialog open={!!personnelToDelete} onOpenChange={(open) => !open && setPersonnelToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción no se puede deshacer. Esto eliminará permanentemente la cuenta del sistema.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setPersonnelToDelete(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
