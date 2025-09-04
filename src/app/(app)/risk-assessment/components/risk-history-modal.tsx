
"use client";

import { useState, useMemo } from 'react';
import { FileText, FileSpreadsheet, AlertTriangle, Search, Filter, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogDescription, ResponsiveDialogFooter, ResponsiveDialogHeader, ResponsiveDialogTitle } from '@/components/ui/responsive-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Student, RiskFactor } from '@/core/domain/types';
import type { RiskWithStudentInfo } from '@/hooks/use-risk-factors';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

type RiskHistoryModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  student: Student | null;
  risks: RiskWithStudentInfo[];
};

const ITEMS_PER_PAGE = 10;
const LARGE_DATASET_THRESHOLD = 100;

export function RiskHistoryModal({
  isOpen,
  onOpenChange,
  student,
  risks,
}: RiskHistoryModalProps) {

  // State for smart functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRisks, setExpandedRisks] = useState<Set<string>>(new Set());

  const handleDownloadPDF = () => {
    if (!student) return;
    
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Reporte de Riesgos', 20, 20);
    
    // Student info
    doc.setFontSize(12);
    doc.text(`Estudiante: ${student.name}`, 20, 35);
    doc.text(`Grado: ${student.grade}, Sección: ${student.section}`, 20, 45);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 20, 55);
    
    // Risk table
    const tableData = filteredRisks.map(risk => [
      getCategoryDisplay(risk.category),
      getLevelDisplay(risk.level),
      risk.notes || 'Sin notas'
    ]);
    
    (doc as any).autoTable({
      head: [['Categoría', 'Nivel', 'Notas']],
      body: tableData,
      startY: 65,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [220, 53, 69] },
      columnStyles: {
        2: { cellWidth: 80 }
      }
    });
    
    doc.save(`riesgos_${student.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleDownloadExcel = () => {
    if (!student) return;
    
    const worksheetData = [
      ['Reporte de Riesgos'],
      [''],
      ['Estudiante:', student.name],
      ['Grado:', student.grade],
      ['Sección:', student.section],
      ['Fecha de generación:', new Date().toLocaleDateString('es-ES')],
      [''],
      ['Categoría', 'Nivel', 'Notas']
    ];
    
    filteredRisks.forEach(risk => {
      worksheetData.push([
        getCategoryDisplay(risk.category),
        getLevelDisplay(risk.level),
        risk.notes || 'Sin notas'
      ]);
    });
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Riesgos');
    
    XLSX.writeFile(workbook, `riesgos_${student?.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };
  
  // Smart filtering and pagination
  const filteredRisks = useMemo(() => {
    return risks.filter(risk => {
      const matchesSearch = getCategoryDisplay(risk.category).toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (risk.notes && risk.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || risk.category === categoryFilter;
      const matchesLevel = levelFilter === 'all' || risk.level === levelFilter;
      return matchesSearch && matchesCategory && matchesLevel;
    });
  }, [risks, searchQuery, categoryFilter, levelFilter]);
  
  const paginatedRisks = useMemo(() => {
    if (risks.length <= LARGE_DATASET_THRESHOLD) {
      return filteredRisks;
    }
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRisks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredRisks, currentPage, risks.length]);
  
  const totalPages = Math.ceil(filteredRisks.length / ITEMS_PER_PAGE);
  const showPagination = risks.length > LARGE_DATASET_THRESHOLD;
  const showControls = risks.length > 10;
  
  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(risks.map(risk => risk.category)));
  }, [risks]);
  
  const uniqueLevels = useMemo(() => {
    return Array.from(new Set(risks.map(risk => risk.level)));
  }, [risks]);
  
  const toggleRiskExpansion = (riskId: string) => {
    setExpandedRisks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(riskId)) {
        newSet.delete(riskId);
      } else {
        newSet.add(riskId);
      }
      return newSet;
    });
  };

  const getLevelVariant = (level: RiskFactor['level']) => {
    switch (level) {
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      case 'Low': return 'default';
      default: return 'outline';
    }
  };

  const getLevelDisplay = (level: RiskFactor['level']) => {
    switch (level) {
      case 'High': return 'Alto';
      case 'Medium': return 'Medio';
      case 'Low': return 'Bajo';
      default: return level;
    }
  };

  const getCategoryDisplay = (category: RiskFactor['category']) => {
    switch (category) {
      case 'Attendance': return 'Asistencia';
      case 'Academic Performance': return 'Rendimiento Académico';
      case 'Family Situation': return 'Situación Familiar';
      default: return category;
    }
  };


  return (
    <ResponsiveDialog open={isOpen} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-2xl p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
        <ResponsiveDialogHeader className="p-6 flex-row items-center justify-between">
            {student && (
                <div>
                    <ResponsiveDialogTitle>{student.name}</ResponsiveDialogTitle>
                    <ResponsiveDialogDescription>
                        {student.grade}, Sección {student.section}
                    </ResponsiveDialogDescription>
                </div>
            )}
             <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                    <FileText className="mr-2 h-4 w-4" />
                    PDF
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadExcel}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Excel
                </Button>
            </div>
        </ResponsiveDialogHeader>

        <div className="p-6">
          {showControls && (
            <div className="mb-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por categoría o notas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      {uniqueCategories.map(category => (
                        <SelectItem key={category} value={category}>{getCategoryDisplay(category)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={levelFilter} onValueChange={setLevelFilter}>
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue placeholder="Nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {uniqueLevels.map(level => (
                        <SelectItem key={level} value={level}>{getLevelDisplay(level)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{filteredRisks.length} factor{filteredRisks.length !== 1 ? 'es' : ''} de riesgo encontrado{filteredRisks.length !== 1 ? 's' : ''}</span>
                {showPagination && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
          
        {filteredRisks.length > 0 ? (
          <ScrollArea className={`${showPagination ? 'max-h-[50vh]' : 'max-h-[70vh]'} -mx-6 scroll-smooth`}>
              <div className="space-y-4 px-6">
              {paginatedRisks.map((risk) => {
                const isExpanded = expandedRisks.has(risk.id);
                return (
                  <Card key={risk.id} className="shadow-sm transition-all duration-200 hover:shadow-md">
                    <CardHeader 
                      className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleRiskExpansion(risk.id)}
                    >
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-primary" />
                          {getCategoryDisplay(risk.category)}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant={getLevelVariant(risk.level)}>{getLevelDisplay(risk.level)}</Badge>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    {isExpanded && (
                      <CardContent className="p-4 pt-0 animate-in slide-in-from-top-2 duration-200">
                        <p className="text-sm text-muted-foreground">
                          {risk.notes || 'Sin notas adicionales'}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
              </div>
          </ScrollArea>
        ) : (
            <p className="text-center text-sm text-muted-foreground py-10">
                {searchQuery || categoryFilter !== 'all' || levelFilter !== 'all'
                  ? 'No se encontraron factores de riesgo que coincidan con los filtros.' 
                  : 'No hay factores de riesgo registrados para este estudiante.'}
            </p>
        )}
        </div>
        
        <ResponsiveDialogFooter className="p-4 bg-background border-t">
            <Button type="button" variant="outline" className="ml-auto" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
