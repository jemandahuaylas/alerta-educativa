
"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PlusCircle, Download } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { useIncidents, IncidentWithStudentInfo } from '@/hooks/use-incidents';
import { useStudents } from '@/hooks/use-students';
import { IncidentFilterSheet } from './incident-filter-sheet';
import { IncidentHistoryModal } from './incident-history-modal';
import { DownloadReportModal } from '@/components/organisms/download-report-modal';
import ResourceToolbar from '@/components/organisms/resource-toolbar';
import FloatingActionButton from '@/components/molecules/floating-action-button';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import ResourceListView from '../resource-list-view';
import { useAppContext } from '@/context/app-context';
import { usePersonnel } from '@/hooks/use-teachers';
import { IncidentListCard } from './incident-list-card';
import { IncidentGridCard } from './incident-grid-card';

type StudentSummary = {
    id: string; 
    studentName: string;
    grade?: string;
    section?: string;
    incidentCount: number;
    pendingCount: number;
};

export default function IncidentList() {
  const { incidentsWithStudentInfo } = useIncidents();
  const { students } = useStudents();
  const { currentUserProfile } = useAppContext();
  const { assignments } = usePersonnel();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('list');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [selectedIncidentTypes, setSelectedIncidentTypes] = useState<string[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedStudentName, setSelectedStudentName] = useState<string | null>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const isRestrictedUser = currentUserProfile?.role === 'Docente' || currentUserProfile?.role === 'Auxiliar';

  const incidentTypesWithCounts = useMemo(() => {
    const typeCounts: { [key: string]: number } = {};
    incidentsWithStudentInfo.forEach(incident => {
      if (Array.isArray(incident.incidentTypes)) {
        incident.incidentTypes.forEach(type => {
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
      }
    });
    return Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => a.type.localeCompare(b.type));
  }, [incidentsWithStudentInfo]);


  const filteredIncidents = useMemo(() => {
    const teacherAssignments = assignments.filter(a => a.teacher_id === currentUserProfile?.id);
    const assignedSectionIds = new Set(teacherAssignments.map(a => a.section_id));

    return incidentsWithStudentInfo.filter(incident => {
      const searchMatch = incident.studentName.toLowerCase().includes(searchQuery.toLowerCase());
      const typeMatch = selectedIncidentTypes.length === 0 || 
                        (Array.isArray(incident.incidentTypes) && selectedIncidentTypes.every(type => incident.incidentTypes.includes(type)));
      
      const sectionMatch = !isRestrictedUser || (incident.sectionId && assignedSectionIds.has(incident.sectionId));

      return searchMatch && typeMatch && sectionMatch;
    });
  }, [incidentsWithStudentInfo, searchQuery, selectedIncidentTypes, isRestrictedUser, assignments, currentUserProfile]);
  
  const studentSummaries: StudentSummary[] = useMemo(() => {
    const incidentsByStudent = filteredIncidents.reduce((acc, incident) => {
      if (!acc[incident.studentId]) {
          acc[incident.studentId] = [];
      }
      acc[incident.studentId].push(incident);
      return acc;
    }, {} as Record<string, IncidentWithStudentInfo[]>);

    return Object.values(incidentsByStudent).map(studentIncidents => {
        const student = studentIncidents[0];
        return {
          id: student.studentId, 
          studentName: student.studentName,
          grade: student.grade,
          section: student.section,
          incidentCount: studentIncidents.length,
          pendingCount: studentIncidents.filter(i => i.status === 'Pendiente').length
        };
    }).sort((a,b) => b.pendingCount - a.pendingCount || b.incidentCount - a.incidentCount);
  }, [filteredIncidents]);


  const handleApplyFilters = (types: string[]) => {
    setSelectedIncidentTypes(types);
    setIsFilterSheetOpen(false);
  }

  const handleCardClick = (studentName: string) => {
    setSelectedStudentName(studentName);
    setIsHistoryModalOpen(true);
  };

  const selectedStudent = useMemo(() => {
    if (!selectedStudentName) return null;
    return students.find(s => s.name === selectedStudentName);
  }, [selectedStudentName, students]);

  const studentIncidents = useMemo(() => {
    if (!selectedStudentName) return [];
    return incidentsWithStudentInfo.filter(i => i.studentName === selectedStudentName)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedStudentName, incidentsWithStudentInfo]);

  const handleDownload = (format: 'pdf' | 'excel') => {
    const appName = "Alerta Educativa";
    const institutionName = "Mi Institución Educativa";
    const reportTitle = "Reporte General de Incidentes";
    const fullTitle = `${appName} - ${reportTitle}`;
    const fileName = `Reporte_Incidentes - ${appName}`.replace(/\s+/g, '_');

    const data = filteredIncidents.map(i => [
      new Date(i.date).toLocaleDateString('es-ES', { timeZone: 'UTC' }),
      i.studentName,
      `${i.grade} - ${i.section}`,
      i.incidentTypes.join(', '),
      i.status,
    ]);

    if (format === 'excel') {
      const worksheet = XLSX.utils.aoa_to_sheet([
        [fullTitle],
        [institutionName],
        [],
        ["Fecha", "Estudiante", "Grado y Sección", "Tipos de Incidente", "Estado"]
      ].concat(data));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Incidentes");
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
    } else {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(fullTitle, 14, 15);
      doc.setFontSize(10);
      doc.text(institutionName, 14, 21);
      (doc as any).autoTable({
        startY: 28,
        head: [["Fecha", "Estudiante", "Grado y Sección", "Tipos de Incidente", "Estado"]],
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
        <Link href="/incidents/nuevo" className="flex-1 sm:flex-none">
          <Button className="w-full">
            <PlusCircle className="mr-2 h-4 w-4" />
            Registrar Incidente
          </Button>
        </Link>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Incidentes"
        actions={pageActions}
      />
      
      <ResourceToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        view={view}
        onViewChange={setView}
        onFilterClick={() => setIsFilterSheetOpen(true)}
        filterBadgeCount={selectedIncidentTypes.length}
      />
      
       <ResourceListView
        items={studentSummaries}
        view={view}
        isLoading={!isClient}
        renderGridItem={(summary) => (
          <IncidentGridCard item={summary} onClick={handleCardClick} />
        )}
        renderListItem={(summary, index) => (
          <IncidentListCard item={summary} onClick={handleCardClick} index={index} />
        )}
        noResultsMessage="No hay incidentes que coincidan con su búsqueda o filtros."
        listClassName="space-y-2"
      />

      <FloatingActionButton onClick={() => router.push('/incidents/nuevo')} />

      <IncidentFilterSheet
        isOpen={isFilterSheetOpen}
        onOpenChange={setIsFilterSheetOpen}
        incidentTypesWithCounts={incidentTypesWithCounts}
        selectedTypes={selectedIncidentTypes}
        onApply={handleApplyFilters}
      />

      {selectedStudent && (
        <IncidentHistoryModal
          isOpen={isHistoryModalOpen}
          onOpenChange={setIsHistoryModalOpen}
          student={selectedStudent}
          incidents={studentIncidents}
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

    

    