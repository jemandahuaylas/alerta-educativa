
"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PlusCircle, Download } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { useStudents } from '@/hooks/use-students';
import { useNee, NeeWithStudentInfo } from '@/hooks/use-nee';
import { Student } from '@/core/domain/types';
import { NeeHistoryModal } from './nee-history-modal';
import ResourceToolbar from '@/components/organisms/resource-toolbar';
import ResourceListView from '@/components/organisms/resource-list-view';
import FloatingActionButton from '@/components/molecules/floating-action-button';
import { useRouter } from 'next/navigation';
import { NeeFilterSheet } from './nee-filter-sheet';
import { DownloadReportModal } from '@/components/organisms/download-report-modal';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useAppContext } from '@/context/app-context';
import { NeeGridCard } from './nee-grid-card';
import { NeeListCard } from './nee-list-card';


type StudentSummary = {
    id: string; // Required for ResourceListView key
    studentName: string;
    grade?: string;
    section?: string;
    neeCount: number;
    diagnoses: string[];
};

export default function NeeList() {
  const { students } = useStudents();
  const { neesWithStudentInfo } = useNee();
  const { currentUserProfile } = useAppContext();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('list');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<Student | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<string[]>([]);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isRestrictedUser = currentUserProfile?.role === 'Docente' || currentUserProfile?.role === 'Auxiliar';

  const neeDiagnosisTypesWithCounts = useMemo(() => {
    const typeCounts: { [key: string]: number } = {};
    neesWithStudentInfo.forEach(nee => {
      if (nee.diagnosis) {
          typeCounts[nee.diagnosis] = (typeCounts[nee.diagnosis] || 0) + 1;
      }
    });
    return Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => a.type.localeCompare(b.type));
  }, [neesWithStudentInfo]);


  const filteredNees = useMemo(() => {
    return neesWithStudentInfo.filter(nee => {
      const searchMatch = nee.studentName.toLowerCase().includes(searchQuery.toLowerCase());
      const diagnosisMatch = selectedDiagnoses.length === 0 || 
                             (nee.diagnosis && selectedDiagnoses.includes(nee.diagnosis));
      return searchMatch && diagnosisMatch;
    });
  }, [neesWithStudentInfo, searchQuery, selectedDiagnoses]);

  const studentSummaries: StudentSummary[] = useMemo(() => {
    const neesByStudent = filteredNees.reduce((acc, nee) => {
      if (!acc[nee.studentId]) {
          acc[nee.studentId] = [];
      }
      acc[nee.studentId].push(nee);
      return acc;
    }, {} as Record<string, NeeWithStudentInfo[]>);

    return Object.values(neesByStudent).map(studentNees => {
        const student = studentNees[0];
        const diagnoses = [...new Set(studentNees.map(n => n.diagnosis))];
        return {
          id: student.studentId, 
          studentName: student.studentName,
          grade: student.grade,
          section: student.section,
          neeCount: studentNees.length,
          diagnoses,
        };
    }).sort((a,b) => b.neeCount - a.neeCount);
  }, [filteredNees]);
  
  const handleCardClick = (studentName: string) => {
    const student = students.find(s => s.name === studentName);
    if (student) {
        setSelectedStudentForHistory(student);
        setIsHistoryModalOpen(true);
    }
  };

  const handleApplyFilters = (diagnoses: string[]) => {
    setSelectedDiagnoses(diagnoses);
    setIsFilterSheetOpen(false);
  }

  const studentNees = useMemo(() => {
    if (!selectedStudentForHistory) return [];
    return neesWithStudentInfo.filter(i => i.studentId === selectedStudentForHistory.id)
      .sort((a, b) => new Date(b.evaluationDate).getTime() - new Date(a.evaluationDate).getTime());
  }, [selectedStudentForHistory, neesWithStudentInfo]);

  const handleDownload = (format: 'pdf' | 'excel') => {
    const appName = "Alerta Educativa";
    const institutionName = "Mi Institución Educativa";
    const reportTitle = "Reporte de Estudiantes con NEE";
    const fullTitle = `${appName} - ${reportTitle}`;
    const fileName = `Reporte_NEE - ${appName}`.replace(/\s+/g, '_');
    
    const data = filteredNees.map(n => [
      new Date(n.evaluationDate).toLocaleDateString('es-ES', { timeZone: 'UTC' }),
      n.studentName,
      `${n.grade} - ${n.section}`,
      n.diagnosis,
      n.supportPlan || '',
    ]);

    if (format === 'excel') {
        const worksheet = XLSX.utils.aoa_to_sheet([
            [fullTitle],
            [institutionName],
            [],
            ["Fecha de Evaluación", "Estudiante", "Grado y Sección", "Diagnóstico", "Plan de Apoyo"]
        ].concat(data));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "NEE");
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    } else {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text(fullTitle, 14, 15);
        doc.setFontSize(10);
        doc.text(institutionName, 14, 21);
        (doc as any).autoTable({
            startY: 28,
            head: [["Fecha de Evaluación", "Estudiante", "Grado y Sección", "Diagnóstico", "Plan de Apoyo"]],
            body: data,
        });
        doc.save(`${fileName}.pdf`);
    }
    setIsDownloadModalOpen(false);
  };

  const pageActions = (
    <div className="flex items-center gap-2">
        {!isRestrictedUser && (
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setIsDownloadModalOpen(true)}>
              <Download className="mr-2 h-4 w-4" />
              Descargar
            </Button>
        )}
        <Link href="/nee/nuevo" className="flex-1 sm:flex-none">
          <Button className="w-full">
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Registro
          </Button>
        </Link>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Estudiantes con NEE"
        actions={pageActions}
      />
      
      <ResourceToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        view={view}
        onViewChange={setView}
        onFilterClick={() => setIsFilterSheetOpen(true)}
        filterBadgeCount={selectedDiagnoses.length}
      />

      <ResourceListView
        items={studentSummaries}
        view={view}
        isLoading={!isClient}
        renderGridItem={(summary) => (
          <NeeGridCard item={summary} onClick={handleCardClick} />
        )}
        renderListItem={(summary) => (
          <NeeListCard item={summary} onClick={handleCardClick} />
        )}
        noResultsMessage="No hay registros NEE que coincidan con su búsqueda."
      />

      <FloatingActionButton onClick={() => router.push('/nee/nuevo')} />
      
      <NeeFilterSheet
        isOpen={isFilterSheetOpen}
        onOpenChange={setIsFilterSheetOpen}
        neeDiagnosisTypesWithCounts={neeDiagnosisTypesWithCounts}
        selectedDiagnoses={selectedDiagnoses}
        onApply={handleApplyFilters}
      />

      {selectedStudentForHistory && (
        <NeeHistoryModal
          isOpen={isHistoryModalOpen}
          onOpenChange={setIsHistoryModalOpen}
          student={selectedStudentForHistory}
          nees={studentNees}
        />
      )}

      <DownloadReportModal
        isOpen={isDownloadModalOpen}
        onOpenChange={setIsDownloadModalOpen}
        onDownload={handleDownload}
      />
    </>
  );
}
