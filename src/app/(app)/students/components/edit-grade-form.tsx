"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogDescription, ResponsiveDialogFooter, ResponsiveDialogHeader, ResponsiveDialogTitle } from '@/components/ui/responsive-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { Grade } from '@/core/domain/types';

type EditGradeFormProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (gradeId: string, newName: string) => void;
  grade: Omit<Grade, 'sections'> | null;
};

export function EditGradeForm({ isOpen, onOpenChange, onSave, grade }: EditGradeFormProps) {
  const [gradeName, setGradeName] = useState('');

  useEffect(() => {
    if (grade) {
      setGradeName(grade.name);
    }
  }, [grade]);

  const handleSubmit = () => {
    if (grade && gradeName.trim()) {
      onSave(grade.id, gradeName.trim());
    }
  };

  return (
    <ResponsiveDialog open={isOpen} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-[425px]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Editar Grado</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Cambie el nombre del grado. Este cambio se reflejará en toda la aplicación.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="space-y-2 py-4">
          <Label htmlFor="grade-name">Nombre del Grado</Label>
          <Input
            id="grade-name"
            value={gradeName}
            onChange={(e) => setGradeName(e.target.value)}
            placeholder="p. ej. 1er Grado"
          />
        </div>
        <ResponsiveDialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="button" onClick={handleSubmit} disabled={!gradeName.trim()}>
            Guardar Cambios
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
