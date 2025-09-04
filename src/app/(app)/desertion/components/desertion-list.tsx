
"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PlusCircle, Download } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Student } from '@/core/domain/types';
import { useStudents } from '@/hooks/use-students';
import { useDesertion, DropoutWithStudentInfo } from '@/hooks/use-desertion';
import { DesertionDetailsModal } from './desertion-details-modal';
import ResourceToolbar from '@/components/organisms/resource-toolbar';
import ResourceListView from '@/components/organisms/resource-list-view';
import FloatingActionButton from '@/components/molecules/floating-action-button';
import { useRouter } from 'next/navigation';
import { DesertionFilterSheet } from './desertion-filter-sheet';
import { DownloadReportModal } from '@/components/organisms/download-report-modal';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useAppContext } from '@/context/app-context';
import { DesertionGridCard } from './desertion-grid-card';
import { DesertionListCard } from './desertion-list-card';


export default function DesertionList() {
  const { students } = useStudents();
  const { dropoutsWithStudentInfo } = useDesertion();
  const { currentUserProfile } = useAppContext();
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('list');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<Student | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const isRestrictedUser = currentUserProfile?.role === 'Docente' || currentUserProfile?.role === 'Auxiliar';

  const dropoutReasonsWithCounts = useMemo(() => {
    const reasonCounts: { [key: string]: number } = {};
    dropoutsWithStudentInfo.forEach(dropout => {
        reasonCounts[dropout.reason] = (reasonCounts[dropout.reason] || 0) + 1;
    });
    return Object.entries(reasonCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => a.type.localeCompare(b.type));
  }, [dropoutsWithStudentInfo]);

  const filteredDropouts = useMemo(() => {
    return dropoutsWithStudentInfo.filter(dropout => {
      const searchMatch = dropout.studentName.toLowerCase().includes(searchQuery.toLowerCase());
      const reasonMatch = selectedReasons.length === 0 || selectedReasons.includes(dropout.reason);
      return searchMatch && reasonMatch;
    });
  }, [dropoutsWithStudentInfo, searchQuery, selectedReasons]);

  const handleCardClick = (studentName: string) => {
    const student = students.find(s => s.name === studentName);
    if (student) {
        setSelectedStudentForDetails(student);
        setIsDetailsModalOpen(true);
    }
  };

  const handleApplyFilters = (reasons: string[]) => {
    setSelectedReasons(reasons);
    setIsFilterSheetOpen(false);
  };

  const studentDropout = useMemo(() => {
    if (!selectedStudentForDetails) return null;
    return dropoutsWithStudentInfo.find(d => d.studentId === selectedStudentForDetails.id) || null;
  }, [selectedStudentForDetails, dropoutsWithStudentInfo]);
  
  const handleDownload = (format: 'pdf' | 'excel') => {
    const appName = "Alerta Educativa";
    const institutionName = "Mi Institución Educativa";
    const reportTitle = "Reporte de Deserción Estudiantil";
    const fullTitle = `${appName} - ${reportTitle}`;
    const fileName = `Reporte_Desercion - ${appName}`.replace(/\s+/g, '_');
    
    const data = filteredDropouts.map(d => [
      new Date(d.dropoutDate).toLocaleDateString('es-ES', { timeZone: 'UTC' }),
      d.studentName,
      `${d.grade} - ${d.section}`,
      d.reason,
      d.notes,
    ]);

    if (format === 'excel') {
        const worksheet = XLSX.utils.aoa_to_sheet([
            [fullTitle],
            [institutionName],
            [],
            ["Fecha de Deserción", "Estudiante", "Grado y Sección", "Razón", "Notas"]
        ].concat(data));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Desercion");
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    } else {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text(fullTitle, 14, 15);
        doc.setFontSize(10);
        doc.text(institutionName, 14, 21);
        (doc as any).autoTable({
            startY: 28,
            head: [["Fecha de Deserción", "Estudiante", "Grado y Sección", "Razón", "Notas"]],
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
        <Link href="/desertion/nuevo" className="flex-1 sm:flex-none">
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
        title="Seguimiento de Deserción"
        actions={pageActions}
      />
      
      <ResourceToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        view={view}
        onViewChange={setView}
        onFilterClick={() => setIsFilterSheetOpen(true)}
        filterBadgeCount={selectedReasons.length}
      />
      
      <ResourceListView
        items={filteredDropouts}
        view={view}
        isLoading={!isClient}
        renderGridItem={(dropout) => (
          <DesertionGridCard item={dropout} onClick={handleCardClick} />
        )}
        renderListItem={(dropout) => (
          <DesertionListCard item={dropout} onClick={handleCardClick} />
        )}
        noResultsMessage="No hay registros de deserción que coincidan con su búsqueda."
      />

      <FloatingActionButton onClick={() => router.push('/desertion/nuevo')} />

      {selectedStudentForDetails && (
        <DesertionDetailsModal
          isOpen={isDetailsModalOpen}
          onOpenChange={setIsDetailsModalOpen}
          student={selectedStudentForDetails}
          dropout={studentDropout}
        />
      )}

      <DesertionFilterSheet
        isOpen={isFilterSheetOpen}
        onOpenChange={setIsFilterSheetOpen}
        dropoutReasonsWithCounts={dropoutReasonsWithCounts}
        selectedReasons={selectedReasons}
        onApply={handleApplyFilters}
      />

      <DownloadReportModal
        isOpen={isDownloadModalOpen}
        onOpenChange={setIsDownloadModalOpen}
        onDownload={handleDownload}
      />
    </>
  );
}
