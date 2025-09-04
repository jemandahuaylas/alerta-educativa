"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogDescription, ResponsiveDialogFooter, ResponsiveDialogHeader, ResponsiveDialogTitle } from '@/components/ui/responsive-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { Section } from '@/core/domain/types';

type EditSectionFormProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (sectionId: string, newName: string) => void;
  section: Section | null;
};

export function EditSectionForm({ isOpen, onOpenChange, onSave, section }: EditSectionFormProps) {
  const [sectionName, setSectionName] = useState('');

  useEffect(() => {
    if (section) {
      setSectionName(section.name);
    }
  }, [section]);

  const handleSubmit = () => {
    if (section && sectionName.trim()) {
      onSave(section.id, sectionName.trim().toUpperCase());
    }
  };

  return (
    <ResponsiveDialog open={isOpen} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-[425px]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Editar Sección</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Cambie el nombre de la sección. Este cambio se reflejará en toda la aplicación.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="space-y-2 py-4">
          <Label htmlFor="section-name">Nombre de la Sección</Label>
          <Input
            id="section-name"
            value={sectionName}
            onChange={(e) => setSectionName(e.target.value)}
            placeholder="p. ej. A"
            className="uppercase"
          />
        </div>
        <ResponsiveDialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="button" onClick={handleSubmit} disabled={!sectionName.trim()}>
            Guardar Cambios
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
