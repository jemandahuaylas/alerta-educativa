
"use client";

import { useState, useMemo } from 'react';
import { CalendarDays, FileText, FileSpreadsheet, ClipboardPlus, ScrollText, Search, Filter, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogDescription, ResponsiveDialogFooter, ResponsiveDialogHeader, ResponsiveDialogTitle } from '@/components/ui/responsive-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Student } from '@/core/domain/types';
import type { NeeWithStudentInfo } from '@/hooks/use-nee';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

type NeeHistoryModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  student: Student | null;
  nees: NeeWithStudentInfo[];
};

const ITEMS_PER_PAGE = 10;
const LARGE_DATASET_THRESHOLD = 100;

export function NeeHistoryModal({
  isOpen,
  onOpenChange,
  student,
  nees,
}: NeeHistoryModalProps) {

  // State for smart functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [diagnosisFilter, setDiagnosisFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedNees, setExpandedNees] = useState<Set<string>>(new Set());

  const handleDownloadPDF = () => {
    if (!student) return;
    
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Reporte NEE', 20, 20);
    
    // Student info
    doc.setFontSize(12);
    doc.text(`Estudiante: ${student.name}`, 20, 35);
    doc.text(`Grado: ${student.grade}, Sección: ${student.section}`, 20, 45);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 20, 55);
    
    // NEE table
    const tableData = filteredNees.map(nee => [
      nee.diagnosis,
      new Date(nee.evaluationDate).toLocaleDateString('es-ES'),
      nee.supportPlan || 'Sin plan de apoyo'
    ]);
    
    (doc as any).autoTable({
      head: [['Diagnóstico', 'Fecha de Evaluación', 'Plan de Apoyo']],
      body: tableData,
      startY: 65,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] },
      columnStyles: {
        2: { cellWidth: 60 }
      }
    });
    
    doc.save(`nee_${student.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleDownloadExcel = () => {
    if (!student) return;
    
    const worksheetData = [
      ['Reporte NEE'],
      [''],
      ['Estudiante:', student.name],
      ['Grado:', student.grade],
      ['Sección:', student.section],
      ['Fecha de generación:', new Date().toLocaleDateString('es-ES')],
      [''],
      ['Diagnóstico', 'Fecha de Evaluación', 'Plan de Apoyo']
    ];
    
    filteredNees.forEach(nee => {
      worksheetData.push([
        nee.diagnosis,
        new Date(nee.evaluationDate).toLocaleDateString('es-ES'),
        nee.supportPlan || 'Sin plan de apoyo'
      ]);
    });
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'NEE');
    
    XLSX.writeFile(workbook, `nee_${student?.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };
  
  // Smart filtering and pagination
  const filteredNees = useMemo(() => {
    return nees.filter(nee => {
      const matchesSearch = nee.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (nee.supportPlan && nee.supportPlan.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesDiagnosis = diagnosisFilter === 'all' || nee.diagnosis === diagnosisFilter;
      return matchesSearch && matchesDiagnosis;
    });
  }, [nees, searchQuery, diagnosisFilter]);
  
  const paginatedNees = useMemo(() => {
    if (nees.length <= LARGE_DATASET_THRESHOLD) {
      return filteredNees;
    }
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredNees.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredNees, currentPage, nees.length]);
  
  const totalPages = Math.ceil(filteredNees.length / ITEMS_PER_PAGE);
  const showPagination = nees.length > LARGE_DATASET_THRESHOLD;
  const showControls = nees.length > 10;
  
  const uniqueDiagnoses = useMemo(() => {
    return Array.from(new Set(nees.map(nee => nee.diagnosis)));
  }, [nees]);
  
  const toggleNeeExpansion = (neeId: string) => {
    setExpandedNees(prev => {
      const newSet = new Set(prev);
      if (newSet.has(neeId)) {
        newSet.delete(neeId);
      } else {
        newSet.add(neeId);
      }
      return newSet;
    });
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
                    placeholder="Buscar por diagnóstico o plan de apoyo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={diagnosisFilter} onValueChange={setDiagnosisFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filtrar por diagnóstico" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los diagnósticos</SelectItem>
                    {uniqueDiagnoses.map(diagnosis => (
                      <SelectItem key={diagnosis} value={diagnosis}>{diagnosis}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{filteredNees.length} registro{filteredNees.length !== 1 ? 's' : ''} NEE encontrado{filteredNees.length !== 1 ? 's' : ''}</span>
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
          
        {filteredNees.length > 0 ? (
          <ScrollArea className={`${showPagination ? 'max-h-[50vh]' : 'max-h-[70vh]'} -mx-6 scroll-smooth`}>
              <div className="space-y-4 px-6">
              {paginatedNees.map((nee) => {
                const isExpanded = expandedNees.has(nee.id);
                return (
                  <Card key={nee.id} className="shadow-sm transition-all duration-200 hover:shadow-md">
                    <CardHeader 
                      className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleNeeExpansion(nee.id)}
                    >
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <ClipboardPlus className="h-4 w-4 text-primary" />
                          {nee.diagnosis}
                        </CardTitle>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </CardHeader>
                    
                    {isExpanded && (
                      <>
                        <CardContent className="p-4 pt-0 animate-in slide-in-from-top-2 duration-200">
                          <div className="flex items-start gap-3">
                            <ScrollText className="h-4 w-4 mt-1 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground flex-1">
                              {nee.supportPlan || 'Sin plan de apoyo definido'}
                            </p>
                          </div>
                        </CardContent>
                        <CardFooter className="p-4 pt-0 flex items-center justify-end animate-in slide-in-from-top-2 duration-200">
                          <time dateTime={nee.evaluationDate} className="text-xs text-muted-foreground flex items-center gap-2">
                            <CalendarDays className="h-3 w-3" />
                            Evaluado: {new Date(nee.evaluationDate).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              timeZone: 'UTC'
                            })}
                          </time>
                        </CardFooter>
                      </>
                    )}
                  </Card>
                );
              })}
              </div>
          </ScrollArea>
        ) : (
            <p className="text-center text-sm text-muted-foreground py-10">
                {searchQuery || diagnosisFilter !== 'all' 
                  ? 'No se encontraron registros NEE que coincidan con los filtros.' 
                  : 'No hay registros NEE para este estudiante.'}
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
