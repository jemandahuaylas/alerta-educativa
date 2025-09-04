
"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PlusCircle, Download } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { usePermissions, PermissionWithStudentInfo } from '@/hooks/use-permissions';
import { useStudents } from '@/hooks/use-students';
import { PermissionHistoryModal } from './permission-history-modal';
import ResourceToolbar from '@/components/organisms/resource-toolbar';
import ResourceListView from '../resource-list-view';
import FloatingActionButton from '@/components/molecules/floating-action-button';
import { useRouter } from 'next/navigation';
import { PermissionFilterSheet } from './permission-filter-sheet';
import { Student } from '@/core/domain/types';
import { DownloadReportModal } from '../download-report-modal';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useAppContext } from '@/context/app-context';
import { PermissionListCard } from './permission-list-card';
import { PermissionGridCard } from './permission-grid-card';

type StudentSummary = {
    id: string; 
    studentName: string;
    grade?: string;
    section?: string;
    permissionCount: number;
    pendingCount: number;
};

export default function PermissionList() {
  const { permissionsWithStudentInfo, permissions } = usePermissions();
  const { students } = useStudents();
  const { currentUserProfile } = useAppContext();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('list');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedStudentName, setSelectedStudentName] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [selectedPermissionTypes, setSelectedPermissionTypes] = useState<string[]>([]);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const isRestrictedUser = currentUserProfile?.role === 'Docente' || currentUserProfile?.role === 'Auxiliar';

  const permissionTypesWithCounts = useMemo(() => {
    const typeCounts: { [key: string]: number } = {};
    permissionsWithStudentInfo.forEach(permission => {
      if (Array.isArray(permission.permissionTypes)) {
        permission.permissionTypes.forEach(type => {
          if (!typeCounts[type]) {
            typeCounts[type] = 0;
          }
          typeCounts[type]++;
        });
      }
    });
    return Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => a.type.localeCompare(b.type));
  }, [permissionsWithStudentInfo]);

  
  const filteredPermissions = useMemo(() => {
    return permissionsWithStudentInfo.filter(permission => {
      const searchMatch = permission.studentName.toLowerCase().includes(searchQuery.toLowerCase());
      const typeMatch = selectedPermissionTypes.length === 0 || 
                        (Array.isArray(permission.permissionTypes) && selectedPermissionTypes.some(type => permission.permissionTypes.includes(type)));
      return searchMatch && typeMatch;
    });
  }, [permissionsWithStudentInfo, searchQuery, selectedPermissionTypes]);

  const studentSummaries: StudentSummary[] = useMemo(() => {
     const permissionsByStudent = filteredPermissions.reduce((acc, permission) => {
      if (!acc[permission.studentId]) {
          acc[permission.studentId] = [];
      }
      acc[permission.studentId].push(permission);
      return acc;
    }, {} as Record<string, PermissionWithStudentInfo[]>);
  
    return Object.values(permissionsByStudent).map(studentPermissions => {
        const student = studentPermissions[0];
        return {
          id: student.studentId, 
          studentName: student.studentName,
          grade: student.grade,
          section: student.section,
          permissionCount: studentPermissions.length,
          pendingCount: studentPermissions.filter(p => p.status === 'Pendiente').length
        };
    }).sort((a,b) => b.pendingCount - a.pendingCount || b.permissionCount - a.permissionCount);
  }, [filteredPermissions]);

  const handleApplyFilters = (types: string[]) => {
    setSelectedPermissionTypes(types);
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

  const studentPermissions = useMemo(() => {
    if (!selectedStudentName) return [];
    return permissions.filter(p => p.studentId === selectedStudent?.id)
      .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
  }, [selectedStudent, permissions]);
  
  const handleDownload = (format: 'pdf' | 'excel') => {
    const appName = "Alerta Educativa";
    const institutionName = "Mi Institución Educativa";
    const reportTitle = "Reporte General de Permisos";
    const fullTitle = `${appName} - ${reportTitle}`;
    const fileName = `Reporte_Permisos - ${appName}`.replace(/\s+/g, '_');
    
    const data = filteredPermissions.map(p => [
      new Date(p.requestDate).toLocaleDateString('es-ES', { timeZone: 'UTC' }),
      p.studentName,
      `${p.grade} - ${p.section}`,
      p.permissionTypes.join(', '),
      p.status,
    ]);

    if (format === 'excel') {
        const worksheet = XLSX.utils.aoa_to_sheet([
            [fullTitle],
            [institutionName],
            [],
            ["Fecha de Solicitud", "Estudiante", "Grado y Sección", "Tipos de Permiso", "Estado"]
        ].concat(data));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Permisos");
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    } else {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text(fullTitle, 14, 15);
        doc.setFontSize(10);
        doc.text(institutionName, 14, 21);
        (doc as any).autoTable({
            startY: 28,
            head: [["Fecha de Solicitud", "Estudiante", "Grado y Sección", "Tipos de Permiso", "Estado"]],
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
        <Link href="/permisos/nuevo" className="flex-1 sm:flex-none">
            <Button className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Permiso
            </Button>
        </Link>
    </div>
  );
  
  return (
    <>
      <PageHeader
        title="Seguimiento de Permisos"
        actions={pageActions}
      />
       
      <ResourceToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        view={view}
        onViewChange={setView}
        onFilterClick={() => setIsFilterSheetOpen(true)}
        filterBadgeCount={selectedPermissionTypes.length}
        showFilterButton={true}
      />
      
      <ResourceListView
        items={studentSummaries}
        view={view}
        isLoading={!isClient}
        renderGridItem={(summary) => (
          <PermissionGridCard item={summary} onClick={handleCardClick} />
        )}
        renderListItem={(summary) => (
          <PermissionListCard item={summary} onClick={handleCardClick} />
        )}
        noResultsMessage="No hay permisos que coincidan con su búsqueda o filtros."
        listClassName="space-y-2"
      />

      <FloatingActionButton onClick={() => router.push('/permisos/nuevo')} />
      
      <PermissionFilterSheet
        isOpen={isFilterSheetOpen}
        onOpenChange={setIsFilterSheetOpen}
        permissionTypesWithCounts={permissionTypesWithCounts}
        selectedTypes={selectedPermissionTypes}
        onApply={handleApplyFilters}
      />

       {selectedStudent && (
        <PermissionHistoryModal
          isOpen={isHistoryModalOpen}
          onOpenChange={setIsHistoryModalOpen}
          student={selectedStudent}
          permissions={studentPermissions}
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
