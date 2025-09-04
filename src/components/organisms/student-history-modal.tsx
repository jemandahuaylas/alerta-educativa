"use client";

import { CalendarDays, FileText, FileSpreadsheet, AlertTriangle, ShieldCheck, ClipboardPlus, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogDescription, ResponsiveDialogFooter, ResponsiveDialogHeader, ResponsiveDialogTitle } from '@/components/ui/responsive-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Student } from '@/core/domain/types';

export type HistoryItem = {
    id: string;
    type: 'Incidente' | 'Permiso' | 'NEE' | 'Deserción';
    date: string;
    description: string;
    tags: string[];
};

type StudentHistoryModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  student: Student | null;
  history: HistoryItem[];
};

const typeToIcon: Record<HistoryItem['type'], React.ElementType> = {
    'Incidente': AlertTriangle,
    'Permiso': ShieldCheck,
    'NEE': ClipboardPlus,
    'Deserción': UserMinus,
}

export function StudentHistoryModal({
  isOpen,
  onOpenChange,
  student,
  history,
}: StudentHistoryModalProps) {

  const handleDownloadPDF = () => {
    alert(`Descargando historial completo para ${student?.name} en PDF...`);
  };

  const handleDownloadExcel = () => {
    alert(`Descargando historial completo para ${student?.name} en Excel...`);
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
        {history.length > 0 ? (
          <ScrollArea className="max-h-96 -mx-6">
              <div className="space-y-4 px-6">
              {history.map((item) => {
                  const Icon = typeToIcon[item.type];
                  return (
                    <Card key={item.id} className="shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                                <Icon className="h-5 w-5 mt-0.5 text-primary" />
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="font-semibold text-sm">{item.type}</p>
                                        <time dateTime={item.date} className="text-xs text-muted-foreground flex items-center gap-2">
                                            <CalendarDays className="h-3 w-3" />
                                            {new Date(item.date).toLocaleDateString('es-ES', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                timeZone: 'UTC'
                                            })}
                                        </time>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                                    <div className="flex flex-wrap gap-1">
                                        {item.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
              </div>
          </ScrollArea>
        ) : (
            <p className="text-center text-sm text-muted-foreground py-10">
                No hay historial registrado para este estudiante.
            </p>
        )}
        </div>
        
        <ResponsiveDialogFooter className="pt-4 p-6 bg-muted/50 rounded-b-lg border-t">
            <Button type="button" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
