
"use client";

import { useState, useMemo } from 'react';
import { PlusCircle } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { Grade, Section } from '@/core/domain/types';
import { useGradesAndSections } from '@/hooks/use-grades-and-sections';
import { useStudents } from '@/hooks/use-students';
import GradeForm from './grade-form';
import { SectionForm } from './section-form';
import { EditGradeForm } from './edit-grade-form';
import FloatingActionButton from '@/components/molecules/floating-action-button';
import { EditSectionForm } from './edit-section-form';
import { useAppContext } from '@/context/app-context';
import { usePersonnel } from '@/hooks/use-teachers';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import GradeTable from './grade-table';

export default function GradeList() {
  console.log('GradeList component is rendering!');
  
  const { 
    grades, 
    addBulkGrades, 
    editGradeName, 
    deleteGrade, 
    addBulkSections, 
    deleteSection,
    editSectionName,
  } = useGradesAndSections();
  const { students } = useStudents();
  const { currentUserProfile } = useAppContext();
  const { assignments } = usePersonnel();
  
  console.log('Hooks loaded, currentUserProfile:', currentUserProfile);
  
  const [isGradeFormOpen, setIsGradeFormOpen] = useState(false);
  const [isEditGradeFormOpen, setIsEditGradeFormOpen] = useState(false);
  const [isSectionFormOpen, setIsSectionFormOpen] = useState(false);
  const [isEditSectionFormOpen, setIsEditSectionFormOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [gradeToEdit, setGradeToEdit] = useState<Omit<Grade, 'sections'> | null>(null);
  const [targetGradeId, setTargetGradeId] = useState<string | null>(null);
  const [gradeToDelete, setGradeToDelete] = useState<Grade | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<{sectionId: string; gradeId: string} | null>(null);
  
  // New state for search and view
  const [searchQuery, setSearchQuery] = useState('');
  
  const isRestrictedUser = currentUserProfile?.role === 'Docente' || currentUserProfile?.role === 'Auxiliar';
  
  // Debug: Verificar perfil del usuario actual
  console.log('Current user profile:', currentUserProfile);
  console.log('User role:', currentUserProfile?.role);
  console.log('Is restricted user:', isRestrictedUser);
  console.log('Button should be visible:', !isRestrictedUser);

  const gradesForCurrentUser = useMemo(() => {
    if (!isRestrictedUser) {
      return grades;
    }
    
    const teacherAssignments = assignments.filter(a => a.teacher_id === currentUserProfile.id);
    const assignedSectionIds = new Set(teacherAssignments.map(a => a.section_id));

    return grades
      .map(grade => ({
        ...grade,
        sections: grade.sections.filter(section => assignedSectionIds.has(section.id)),
      }))
      .filter(grade => grade.sections.length > 0);
  }, [grades, assignments, currentUserProfile, isRestrictedUser]);

  // Filter grades based on search query
  const filteredGrades = useMemo(() => {
    if (!searchQuery.trim()) {
      return gradesForCurrentUser;
    }
    
    return gradesForCurrentUser.filter(grade => 
      grade.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grade.sections.some(section => 
        section.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [gradesForCurrentUser, searchQuery]);

  const handleAddGrade = () => {
    setIsGradeFormOpen(true);
  };



  const handleEditGrade = (grade: Omit<Grade, 'sections'>) => {
    setGradeToEdit(grade);
    setIsEditGradeFormOpen(true);
  };
  
  const handleDeleteGrade = async () => {
    if (gradeToDelete) {
        await deleteGrade(gradeToDelete.id);
        setGradeToDelete(null);
    }
  };

  const handleSaveBulkGrades = async (gradeNames: string[]) => {
    await addBulkGrades(gradeNames);
    setIsGradeFormOpen(false);
  };

  const handleSaveGrade = async (gradeId: string, newName: string) => {
    await editGradeName(gradeId, newName);
    setIsEditGradeFormOpen(false);
  }

  const handleAddSection = (gradeId: string) => {
    setTargetGradeId(gradeId);
    setIsSectionFormOpen(true);
  };

  const handleEditSection = (section: Section, gradeId: string) => {
    setSelectedSection(section);
    setIsEditSectionFormOpen(true);
  };
  
  const handleSaveSection = async (sectionId: string, newName: string) => {
    await editSectionName(sectionId, newName);
    setIsEditSectionFormOpen(false);
  };

  const handleDeleteSection = async () => {
    if (sectionToDelete) {
        await deleteSection(sectionToDelete.gradeId, sectionToDelete.sectionId);
        setSectionToDelete(null);
    }
  };

  const handleSaveBulkSections = async (sectionNames: string[]) => {
    if (!targetGradeId) return;
    await addBulkSections(targetGradeId, sectionNames);
    setIsSectionFormOpen(false);
    setTargetGradeId(null);
  };
  
  const existingGradeNames = grades.map(g => g.name);

  const studentCountInGradeToDelete = useMemo(() => {
    if (!gradeToDelete) return 0;
    return students.filter(student => student.gradeId === gradeToDelete.id).length;
  }, [gradeToDelete, students]);
  
  const studentCountInSectionToDelete = useMemo(() => {
    if (!sectionToDelete) return 0;
    const { gradeId, sectionId } = sectionToDelete;
    return students.filter(student => student.gradeId === gradeId && student.sectionId === sectionId).length;
  }, [sectionToDelete, students]);

  const handleDeleteSectionClick = (sectionId: string) => {
    const section = grades
      .flatMap(g => g.sections.map(s => ({ ...s, gradeId: g.id })))
      .find(s => s.id === sectionId);
    if (section) {
      setSectionToDelete({ gradeId: section.gradeId, sectionId });
    }
  };

  const renderEmptyState = () => (
    <>
      <PageHeader
        title="Gestión de Grados y Secciones"
        actions={!isRestrictedUser ? (
          <Button onClick={handleAddGrade}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Grado
          </Button>
        ) : undefined}
      />
      <Card className="text-center py-12">
        <CardHeader>
          <CardTitle>{isRestrictedUser ? 'No tiene secciones asignadas' : 'No hay grados creados'}</CardTitle>
          <CardDescription>
            {isRestrictedUser 
              ? 'Póngase en contacto con un administrador para que le asigne a una o más secciones.'
              : 'Comience por crear un nuevo grado para organizar a sus estudiantes.'
            }
          </CardDescription>
        </CardHeader>
        {!isRestrictedUser && (
          <CardContent>
            <Button onClick={handleAddGrade}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear Primer Grado
            </Button>
          </CardContent>
        )}
      </Card>
    </>
  );

  const renderGradesList = () => (
    <>
      <PageHeader
        title="Gestión de Grados y Secciones"
        actions={!isRestrictedUser ? (
          <Button onClick={handleAddGrade}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Grado
          </Button>
        ) : undefined}
      />

      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por nombre de grado o sección..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Grado</TableHead>
              <TableHead>Estudiantes</TableHead>
              <TableHead>Secciones</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGrades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "No se encontraron grados con esos términos de búsqueda" : "No hay grados disponibles"}
                </TableCell>
              </TableRow>
            ) : (
              filteredGrades.map((grade) => (
                <GradeTable
                  key={grade.id}
                  grade={grade}
                  sections={grade.sections}
                  isRestrictedUser={isRestrictedUser}
                  onEditGrade={handleEditGrade}
                  onDeleteGrade={(gradeId) => setGradeToDelete(grades.find(g => g.id === gradeId) || null)}
                  onAddSection={handleAddSection}
                  onEditSection={(section) => handleEditSection(section, grade.id)}
                  onDeleteSection={handleDeleteSectionClick}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!isRestrictedUser && <FloatingActionButton onClick={handleAddGrade} />}
    </>
  );

  return (
    <>
      {gradesForCurrentUser.length === 0 ? renderEmptyState() : renderGradesList()}
      
      <GradeForm
        isOpen={isGradeFormOpen}
        onOpenChange={setIsGradeFormOpen}
        onSave={handleSaveBulkGrades}
        existingGradeNames={existingGradeNames}
      />

      <EditGradeForm
        isOpen={isEditGradeFormOpen}
        onOpenChange={setIsEditGradeFormOpen}
        onSave={handleSaveGrade}
        grade={gradeToEdit}
      />
      
      {targetGradeId && (
         <SectionForm
            isOpen={isSectionFormOpen}
            onOpenChange={setIsSectionFormOpen}
            onSave={handleSaveBulkSections}
            existingSectionNames={grades.find(g => g.id === targetGradeId)?.sections.map(s => s.name) || []}
        />
      )}

      <EditSectionForm
        isOpen={isEditSectionFormOpen}
        onOpenChange={setIsEditSectionFormOpen}
        onSave={handleSaveSection}
        section={selectedSection}
      />

      <AlertDialog open={!!gradeToDelete} onOpenChange={(open) => !open && setGradeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {studentCountInGradeToDelete > 0 ? 'No se puede eliminar el grado' : '¿Está seguro?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {studentCountInGradeToDelete > 0
                ? `Este grado contiene ${studentCountInGradeToDelete} estudiante(s) y no puede ser eliminado. Primero debe mover o eliminar a los estudiantes.`
                : 'Esta acción no se puede deshacer. Esto eliminará permanentemente el grado y todas sus secciones.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setGradeToDelete(null)}>
              {studentCountInGradeToDelete > 0 ? 'Entendido' : 'Cancelar'}
            </AlertDialogCancel>
            {studentCountInGradeToDelete === 0 && (
              <AlertDialogAction onClick={handleDeleteGrade} className="bg-destructive hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        
      <AlertDialog open={!!sectionToDelete} onOpenChange={(open) => !open && setSectionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {studentCountInSectionToDelete > 0 ? 'No se puede eliminar la sección' : '¿Está seguro?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {studentCountInSectionToDelete > 0
                ? `Esta sección contiene ${studentCountInSectionToDelete} estudiante(s) y no puede ser eliminada. Primero debe mover o eliminar a los estudiantes.`
                : 'Esta acción no se puede deshacer. Esto eliminará permanentemente la sección.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSectionToDelete(null)}>
              {studentCountInSectionToDelete > 0 ? 'Entendido' : 'Cancelar'}
            </AlertDialogCancel>
            {studentCountInSectionToDelete === 0 && (
              <AlertDialogAction onClick={handleDeleteSection} className="bg-destructive hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
