
"use client";

import { useState } from 'react';
import { FileText, FileSpreadsheet, Calendar, StickyNote, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogDescription, ResponsiveDialogFooter, ResponsiveDialogHeader, ResponsiveDialogTitle } from '@/components/ui/responsive-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Student } from '@/core/domain/types';
import type { DropoutWithStudentInfo } from '@/hooks/use-desertion';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

type DesertionDetailsModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  student: Student | null;
  dropout: DropoutWithStudentInfo | null;
};

export function DesertionDetailsModal({
  isOpen,
  onOpenChange,
  student,
  dropout,
}: DesertionDetailsModalProps) {

  // State for expand/collapse functionality
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['date', 'reason', 'notes']));

  const handleDownloadPDF = () => {
    if (!student || !dropout) return;
    
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Reporte de Deserción', 20, 20);
    
    // Student info
    doc.setFontSize(12);
    doc.text(`Estudiante: ${student.name}`, 20, 35);
    doc.text(`Grado: ${student.grade}, Sección: ${student.section}`, 20, 45);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 20, 55);
    
    // Desertion details
    doc.text('Detalles de la Deserción:', 20, 70);
    doc.setFontSize(10);
    doc.text(`Fecha de deserción: ${new Date(dropout.dropoutDate).toLocaleDateString('es-ES', { timeZone: 'UTC' })}`, 20, 80);
    doc.text(`Razón: ${getReasonDisplay(dropout.reason)}`, 20, 90);
    
    // Notes with text wrapping
    const notes = dropout.notes || 'Sin notas adicionales';
    const splitNotes = doc.splitTextToSize(notes, 170);
    doc.text('Notas adicionales:', 20, 100);
    doc.text(splitNotes, 20, 110);
    
    doc.save(`desercion_${student.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleDownloadExcel = () => {
    if (!student || !dropout) return;
    
    const worksheetData = [
      ['Reporte de Deserción'],
      [''],
      ['Estudiante:', student.name],
      ['Grado:', student.grade],
      ['Sección:', student.section],
      ['Fecha de generación:', new Date().toLocaleDateString('es-ES')],
      [''],
      ['Fecha de Deserción:', new Date(dropout.dropoutDate).toLocaleDateString('es-ES', { timeZone: 'UTC' })],
      ['Razón:', getReasonDisplay(dropout.reason)],
      ['Notas Adicionales:', dropout.notes || 'Sin notas adicionales']
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Deserción');
    
    XLSX.writeFile(workbook, `desercion_${student?.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };
  
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };
  
  const getReasonDisplay = (reason: string) => {
    const reasons: { [key: string]: string } = {
        'Family Issues': 'Problemas Familiares',
        'Relocation': 'Reubicación',
        'Academic Struggles': 'Dificultades Académicas',
        'Other': 'Otro',
    };
    return reasons[reason] || reason;
  };


  return (
    <ResponsiveDialog open={isOpen} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-xl p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
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
        {dropout ? (
          <div className="space-y-4">
             <Card className="shadow-sm transition-all duration-200 hover:shadow-md">
                <CardHeader 
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleSection('date')}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        Fecha de Deserción
                    </CardTitle>
                    {expandedSections.has('date') ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
                {expandedSections.has('date') && (
                  <CardContent className="p-4 pt-0 animate-in slide-in-from-top-2 duration-200">
                      <p className="text-sm text-muted-foreground">
                          {new Date(dropout.dropoutDate).toLocaleDateString('es-ES', {
                              year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
                          })}
                      </p>
                  </CardContent>
                )}
             </Card>
             
             <Card className="shadow-sm transition-all duration-200 hover:shadow-md">
                <CardHeader 
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleSection('reason')}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-primary" />
                        Razón
                    </CardTitle>
                    {expandedSections.has('reason') ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
                {expandedSections.has('reason') && (
                  <CardContent className="p-4 pt-0 animate-in slide-in-from-top-2 duration-200">
                      <p className="text-sm text-muted-foreground">{getReasonDisplay(dropout.reason)}</p>
                  </CardContent>
                )}
             </Card>
             
             <Card className="shadow-sm transition-all duration-200 hover:shadow-md">
                <CardHeader 
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleSection('notes')}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <StickyNote className="h-4 w-4 text-primary" />
                        Notas Adicionales
                    </CardTitle>
                    {expandedSections.has('notes') ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
                {expandedSections.has('notes') && (
                  <CardContent className="p-4 pt-0 animate-in slide-in-from-top-2 duration-200">
                      <p className="text-sm text-muted-foreground">{dropout.notes || 'Sin notas adicionales'}</p>
                  </CardContent>
                )}
             </Card>
          </div>
        ) : (
            <p className="text-center text-sm text-muted-foreground py-10">
                No se encontraron detalles del registro de deserción para este estudiante.
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
