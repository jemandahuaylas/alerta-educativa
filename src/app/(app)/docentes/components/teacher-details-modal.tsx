
"use client";

import { Button } from '@/components/ui/button';
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogDescription, ResponsiveDialogFooter, ResponsiveDialogHeader, ResponsiveDialogTitle } from '@/components/ui/responsive-dialog';
import { Badge } from '@/components/ui/badge';
import type { UserProfile } from '@/core/domain/types';
import { Mail, Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

type TeacherDetailsModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  teacher: UserProfile | null;
  assignments: { gradeName: string; sectionName: string }[];
};

export function TeacherDetailsModal({
  isOpen,
  onOpenChange,
  teacher,
  assignments,
}: TeacherDetailsModalProps) {
  if (!teacher) return null;

  return (
    <ResponsiveDialog open={isOpen} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{teacher.name}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Información detallada del personal.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="space-y-4 py-4">
            <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{teacher.email}</span>
            </div>
             <div className="flex items-center gap-3">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">DNI: {teacher.dni}</span>
            </div>
             <div>
                {assignments.length > 0 ? (
                    <div className="bg-muted/50 p-3 rounded-md">
                        <span className="text-sm font-semibold mr-2 mb-2 block">Secciones asignadas:</span>
                        <ScrollArea className="h-32">
                            <div className="flex flex-col gap-2">
                                {assignments.map(({ gradeName, sectionName }, i) => (
                                <Badge key={i} variant="secondary">{`${gradeName} - Sección "${sectionName}"`}</Badge>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                ) : (
                <p className="text-sm text-muted-foreground italic p-3 bg-muted/50 rounded-md">No hay secciones asignadas</p>
                )}
            </div>
        </div>
        <ResponsiveDialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
