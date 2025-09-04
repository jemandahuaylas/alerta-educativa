
"use client";

import { FileText, FileSpreadsheet, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogDescription, ResponsiveDialogFooter, ResponsiveDialogHeader, ResponsiveDialogTitle } from '@/components/ui/responsive-dialog';

type DownloadReportModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onDownload?: (format: 'pdf' | 'excel') => void;
  title?: string;
  description?: string;
};

export function DownloadReportModal({
  isOpen,
  onOpenChange,
  onDownload,
  title = 'Descargar Reporte General',
  description = 'Seleccione el formato en el que desea exportar el reporte.',
}: DownloadReportModalProps) {

  const handleDownloadClick = (format: 'pdf' | 'excel') => {
    if (onDownload) {
      onDownload(format);
    } else {
      // Fallback for existing components that don't pass onDownload
      alert(`Descargando reporte en ${format.toUpperCase()}...`);
      onOpenChange(false);
    }
  };

  return (
    <ResponsiveDialog open={isOpen} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md overflow-hidden">
        <div className="relative z-10 flex flex-col items-center text-center p-6">
            <ResponsiveDialogHeader className="mb-4">
                <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
                <ResponsiveDialogDescription>{description}</ResponsiveDialogDescription>
            </ResponsiveDialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 w-full">
                <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => handleDownloadClick('pdf')}>
                    <FileText className="h-8 w-8 text-primary" />
                    <span className="font-semibold">Descargar PDF</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => handleDownloadClick('excel')}>
                    <FileSpreadsheet className="h-8 w-8 text-green-600" />
                    <span className="font-semibold">Descargar Excel</span>
                </Button>
            </div>
        </div>
        <ResponsiveDialogFooter className="p-4 pt-0 relative z-10">
            <Button 
                type="button" 
                variant="ghost"
                className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onOpenChange(false)}
            >
                Cancelar
            </Button>
        </ResponsiveDialogFooter>
         <Archive className="absolute -bottom-12 -right-12 z-0 h-48 w-48 text-muted/30 rotate-[30deg] pointer-events-none" />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
