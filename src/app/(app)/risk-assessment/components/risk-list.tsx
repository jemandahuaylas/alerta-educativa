
"use client";

import { useState, useMemo, useEffect } from 'react';
import { PlusCircle, Download } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Student, RiskFactor } from '@/core/domain/types';
import { useStudents } from '@/hooks/use-students';
import { useRiskFactors, RiskWithStudentInfo } from '@/hooks/use-risk-factors';
import { RiskForm, RiskFormValues } from './risk-form';
import { RiskHistoryModal } from './risk-history-modal';
import ResourceToolbar from '@/components/organisms/resource-toolbar';
import ResourceListView from '@/components/organisms/resource-list-view';
import FloatingActionButton from '@/components/molecules/floating-action-button';
import { RiskFilterSheet } from './risk-filter-sheet';
import { DownloadReportModal } from '@/components/organisms/download-report-modal';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { RiskGridCard } from './risk-grid-card';
import { RiskListCard } from './risk-list-card';

type StudentSummary = {
    id: string; // Required for ResourceListView key
    studentName: string;
    grade?: string;
    section?: string;
    riskCount: number;
    highRiskCount: number;
};

export default function RiskList() {
  const { students } = useStudents();
  const { risksWithStudentInfo, addRiskFactor, editRiskFactor } = useRiskFactors();
  const { toast } = useToast();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<RiskWithStudentInfo | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('list');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<Student | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const riskCategoriesWithCounts = useMemo(() => {
    const typeCounts: { [key: string]: number } = {};
    risksWithStudentInfo.forEach(risk => {
        typeCounts[risk.category] = (typeCounts[risk.category] || 0) + 1;
    });
    const categoryDisplay: Record<RiskFactor['category'], string> = {
        'Attendance': 'Asistencia',
        'Academic Performance': 'Rendimiento Académico',
        'Family Situation': 'Situación Familiar',
    };
    return (Object.entries(typeCounts) as [RiskFactor['category'], number][])
      .map(([type, count]) => ({ type, count, display: categoryDisplay[type] }))
      .sort((a, b) => a.type.localeCompare(b.type));
  }, [risksWithStudentInfo]);

  const riskLevelsWithCounts = useMemo(() => {
    const typeCounts: { [key: string]: number } = {};
    risksWithStudentInfo.forEach(risk => {
        typeCounts[risk.level] = (typeCounts[risk.level] || 0) + 1;
    });
     const levelDisplay: Record<RiskFactor['level'], string> = {
      'High': 'Alto',
      'Medium': 'Medio',
      'Low': 'Bajo',
    };
    return (Object.entries(typeCounts) as [RiskFactor['level'], number][])
      .map(([type, count]) => ({ type, count, display: levelDisplay[type] }))
      .sort((a, b) => a.type.localeCompare(b.type));
  }, [risksWithStudentInfo]);
  
  const handleAdd = () => {
    setSelectedRisk(undefined);
    setIsFormOpen(true);
  };
  
  const handleSave = async (riskData: RiskFormValues) => {
    if (riskData.id) {
        await editRiskFactor(riskData.id, riskData);
         toast({ title: "Registro Actualizado", description: `El factor de riesgo para ${riskData.studentName} ha sido actualizado.` });
    } else {
        await addRiskFactor(riskData);
        toast({ title: "Registro Exitoso", description: `Factor de riesgo añadido para ${riskData.studentName}.` });
    }
    setIsFormOpen(false);
  };

  const filteredRisks = useMemo(() => {
    return risksWithStudentInfo.filter(risk => {
      const searchMatch = risk.studentName.toLowerCase().includes(searchQuery.toLowerCase());
      const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(risk.category);
      const levelMatch = selectedLevels.length === 0 || selectedLevels.includes(risk.level);
      return searchMatch && categoryMatch && levelMatch;
    });
  }, [risksWithStudentInfo, searchQuery, selectedCategories, selectedLevels]);

  const studentSummaries: StudentSummary[] = useMemo(() => {
    const risksByStudent = filteredRisks.reduce((acc, risk) => {
      if (!acc[risk.studentId]) {
          acc[risk.studentId] = [];
      }
      acc[risk.studentId].push(risk);
      return acc;
    }, {} as Record<string, RiskWithStudentInfo[]>);
  
    return Object.values(risksByStudent).map(studentRisks => {
        const student = studentRisks[0];
        return {
          id: student.studentId, // Use student id as unique id for summary
          studentName: student.studentName,
          grade: student.grade,
          section: student.section,
          riskCount: studentRisks.length,
          highRiskCount: studentRisks.filter(r => r.level === 'High').length,
        };
    }).sort((a,b) => b.highRiskCount - a.highRiskCount || b.riskCount - a.riskCount);
  }, [filteredRisks]);

  const handleCardClick = (studentName: string) => {
    const student = students.find(s => s.name === studentName);
    if (student) {
        setSelectedStudentForHistory(student);
        setIsHistoryModalOpen(true);
    }
  };

  const handleApplyFilters = (filters: { categories: string[]; levels: string[] }) => {
    setSelectedCategories(filters.categories);
    setSelectedLevels(filters.levels);
    setIsFilterSheetOpen(false);
  };

  const studentRisks = useMemo(() => {
    if (!selectedStudentForHistory) return [];
    return risksWithStudentInfo.filter(i => i.studentId === selectedStudentForHistory.id);
  }, [selectedStudentForHistory, risksWithStudentInfo]);
  
  const handleDownload = (format: 'pdf' | 'excel') => {
    const appName = "Alerta Educativa";
    const institutionName = "Mi Institución Educativa";
    const reportTitle = "Reporte de Evaluación de Riesgos";
    const fullTitle = `${appName} - ${reportTitle}`;
    const fileName = `Reporte_Riesgos - ${appName}`.replace(/\s+/g, '_');
    
    const data = filteredRisks.map(r => [
      r.studentName,
      `${r.grade} - ${r.section}`,
      r.category,
      r.level,
      r.notes,
    ]);

    if (format === 'excel') {
        const worksheet = XLSX.utils.aoa_to_sheet([
            [fullTitle],
            [institutionName],
            [],
            ["Estudiante", "Grado y Sección", "Categoría", "Nivel", "Notas"]
        ].concat(data));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Riesgos");
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    } else {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text(fullTitle, 14, 15);
        doc.setFontSize(10);
        doc.text(institutionName, 14, 21);
        (doc as any).autoTable({
            startY: 28,
            head: [["Estudiante", "Grado y Sección", "Categoría", "Nivel", "Notas"]],
            body: data,
        });
        doc.save(`${fileName}.pdf`);
    }
    setIsDownloadModalOpen(false);
  };

  const pageActions = (
    <div className="flex items-center gap-2">
        <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setIsDownloadModalOpen(true)}>
          <Download className="mr-2 h-4 w-4" />
          Descargar
        </Button>
        <Button onClick={handleAdd} className="flex-1 sm:flex-none">
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Factor de Riesgo
        </Button>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Evaluación de Riesgos"
        actions={pageActions}
      />
      
      <ResourceToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        view={view}
        onViewChange={setView}
        onFilterClick={() => setIsFilterSheetOpen(true)}
        filterBadgeCount={selectedCategories.length + selectedLevels.length}
      />
      
      <ResourceListView
        items={studentSummaries}
        view={view}
        isLoading={!isClient}
        renderGridItem={(summary) => (
          <RiskGridCard item={summary} onClick={handleCardClick} />
        )}
        renderListItem={(summary) => (
          <RiskListCard item={summary} onClick={handleCardClick} />
        )}
        noResultsMessage="No hay factores de riesgo que coincidan con su búsqueda."
      />
      
      <FloatingActionButton onClick={handleAdd} />

      <RiskForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSave}
        risk={selectedRisk}
      />

      {selectedStudentForHistory && (
        <RiskHistoryModal
          isOpen={isHistoryModalOpen}
          onOpenChange={setIsHistoryModalOpen}
          student={selectedStudentForHistory}
          risks={studentRisks}
        />
      )}

      <RiskFilterSheet
        isOpen={isFilterSheetOpen}
        onOpenChange={setIsFilterSheetOpen}
        riskCategoriesWithCounts={riskCategoriesWithCounts}
        riskLevelsWithCounts={riskLevelsWithCounts}
        selectedCategories={selectedCategories}
        selectedLevels={selectedLevels}
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
