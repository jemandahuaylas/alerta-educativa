
"use client";

import { useState, useEffect, useMemo } from 'react';
import { PlusCircle, FileUp, Download } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/page-header';
import type { Student } from '@/core/domain/types';
import { useStudents } from '@/hooks/use-students';
import { useGradesAndSections } from '@/hooks/use-grades-and-sections';
import { StudentForm, StudentFormValues } from './student-form';
import { ImportStudentsModal } from './import-students-modal';
import ResourceToolbar from '@/components/organisms/resource-toolbar';
import FloatingActionButton from '@/components/molecules/floating-action-button';
import ResourceListView from '@/components/organisms/resource-list-view';
import { DownloadReportModal } from '@/components/organisms/download-report-modal';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/app-context';
import { StudentListCard } from './student-list-card';
import { StudentGridCard } from './student-grid-card';
import { StudentHistoryModal } from '@/components/organisms/student-history-modal';


const STUDENTS_PER_PAGE = 10;

const formatGradeName = (name: string) => {
    const gradeMap: { [key: string]: string } = {
      '1ro': 'Primero',
      '2do': 'Segundo',
      '3ro': 'Tercero',
      '4to': 'Cuarto',
      '5to': 'Quinto',
      '6to': 'Sexto',
    };
    return gradeMap[name.toLowerCase()] || name;
};


export default function StudentList() {
  const params = useParams();
  const router = useRouter();
  const gradeId = params.gradeId as string;
  const sectionId = params.sectionId as string;
  
  const { grades } = useGradesAndSections();
  const { 
    students, 
    addStudent, 
    editStudent, 
    deleteStudent, 
    importStudents, 
  } = useStudents();
  const { currentUserProfile } = useAppContext();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('list');
  const [visibleStudentsCount, setVisibleStudentsCount] = useState(STUDENTS_PER_PAGE);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const studentsInSection = useMemo(() => 
    students.filter(s => s.gradeId === gradeId && s.sectionId === sectionId)
    .sort((a, b) => a.lastName.localeCompare(b.lastName)), 
    [students, gradeId, sectionId]
  );
  
  const grade = useMemo(() => grades.find(g => g.id === gradeId), [grades, gradeId]);
  const section = useMemo(() => grade?.sections.find(s => s.id === sectionId), [grade, sectionId]);
  
  const filteredStudents = studentsInSection.filter(student => 
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.dni.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const studentsToShow = filteredStudents.slice(0, visibleStudentsCount);
  const hasMoreStudents = visibleStudentsCount < filteredStudents.length;
  
  const handleDownload = (format: 'pdf' | 'excel') => {
    const appName = "Alerta Educativa";
    const institutionName = "Mi Institución Educativa";
    const reportTitle = `Nómina de Estudiantes - ${grade?.name} ${section?.name}`;
    const fullTitle = `${appName} - ${reportTitle}`;
    const fileName = `Nómina ${grade?.name} ${section?.name} - ${appName}`.replace(/\s+/g, '_');
    
    const data = studentsInSection.map((s, i) => [(i + 1).toString(), s.lastName, s.firstName, s.dni]);

    if (format === 'excel') {
        const worksheet = XLSX.utils.aoa_to_sheet([
            [fullTitle],
            [institutionName],
            [],
            ["#", "Apellidos", "Nombres", "DNI"]
        ].concat(data));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Nómina");
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    } else {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text(fullTitle, 14, 15);
        doc.setFontSize(10);
        doc.text(institutionName, 14, 21);
        (doc as any).autoTable({
            startY: 28,
            head: [["#", "Apellidos", "Nombres", "DNI"]],
            body: data,
        });
        doc.save(`${fileName}.pdf`);
    }
    setIsDownloadModalOpen(false);
  };


  const handleLoadMore = () => {
    setVisibleStudentsCount(prevCount => prevCount + STUDENTS_PER_PAGE);
  };

  const handleAdd = () => {
    setSelectedStudent(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setIsFormOpen(true);
  };
  
  const handleSave = async (studentData: StudentFormValues) => {
    if (studentData.id) {
      await editStudent(studentData.id, studentData);
    } else {
      if (grade && section) {
        await addStudent(studentData, grade, section);
      }
    }
    setIsFormOpen(false);
  };

  const handleImport = async (newStudents: Omit<Student, 'id' | 'name' | 'grade' | 'section' | 'gradeId' | 'sectionId' | 'first_name' | 'last_name'>[]) => {
    if(grade && section) {
        const result = await importStudents(newStudents, grade, section);
        if (result) {
            const { importedCount, skippedCount } = result;
            let description = `Se importaron ${importedCount} estudiante(s) exitosamente.`;
            if (skippedCount > 0) {
                description += ` Se omitieron ${skippedCount} por ya estar registrados.`;
            }
            toast({
                title: "Importación Completada",
                description: description,
            });
        }
    }
    setIsImportModalOpen(false);
  }
  
  if (!isClient) {
    return (
      <div className="rounded-lg border shadow-sm">
      <ResourceListView
        items={[]}
        view="list"
        isLoading={true}
        renderListItem={() => null}
        renderGridItem={() => null}
        noResultsMessage=""
        listClassName="space-y-2"
      />
    </div>
    );
  }

  if (!grade || !section) {
    return (
        <div className="mt-8 text-center">
            <h1 className="text-2xl font-bold">Grado o sección no encontrado</h1>
            <p className="text-muted-foreground mt-2">No se pudo encontrar el grado o la sección que está buscando.</p>
            <Link href="/students" className="mt-4 inline-block">
                <Button variant="outline">Volver a Estudiantes</Button>
            </Link>
        </div>
    )
  }

  const isRestrictedUser = currentUserProfile?.role === 'Docente' || currentUserProfile?.role === 'Auxiliar';

  const pageActions = (
     <div className="flex items-center gap-2">
        {!isRestrictedUser && (
           <Button variant="outline" className="hidden sm:flex" onClick={() => setIsImportModalOpen(true)}>
             <FileUp className="mr-2 h-4 w-4" />
             Importar
           </Button>
        )}
        <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setIsDownloadModalOpen(true)}>
          <Download className="mr-2 h-4 w-4" />
          Descargar Nómina
        </Button>
        {!isRestrictedUser && (
            <Button onClick={handleAdd} className="flex-1 sm:flex-none">
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Estudiante
            </Button>
        )}
    </div>
  );

  return (
    <>
      <PageHeader
        title={`${formatGradeName(grade.name)} ${section.name}`}
        actions={pageActions}
      />
      
      <ResourceToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Buscar por nombre, apellido o DNI..."
        view={view}
        onViewChange={setView}
        onFilterClick={() => alert('Los filtros para estudiantes aún no están implementados.')}
        showFilterButton={false}
      />
      
      <ResourceListView
        items={studentsToShow}
        view={view}
        isLoading={!isClient}
        renderListItem={(student, index) => (
          <StudentListCard
            item={student}
            index={index}
            onEdit={handleEdit}
            onDelete={deleteStudent}
          />
        )}
        renderGridItem={(student) => (
            <StudentGridCard 
                item={student}
            />
        )}
        noResultsMessage="No hay estudiantes que coincidan con su búsqueda."
        listClassName="space-y-2"
      />
      
      {hasMoreStudents && (
        <div className="mt-6 flex justify-center">
          <Button onClick={handleLoadMore} variant="outline">
            Cargar más
          </Button>
        </div>
      )}

      {!isRestrictedUser && <FloatingActionButton onClick={handleAdd} />}
      
      <StudentForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSave}
        student={selectedStudent}
      />

      <ImportStudentsModal
        isOpen={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onImport={handleImport}
      />
      
      <DownloadReportModal
        isOpen={isDownloadModalOpen}
        onOpenChange={setIsDownloadModalOpen}
        onDownload={handleDownload}
        title="Descargar Nómina de Estudiantes"
      />
    </>
  );
}

    