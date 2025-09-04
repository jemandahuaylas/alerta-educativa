"use client";

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogDescription, ResponsiveDialogFooter, ResponsiveDialogHeader, ResponsiveDialogTitle } from '@/components/ui/responsive-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const initialAvailableSections = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

type SectionFormProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (sections: string[]) => void;
  existingSectionNames: string[];
};

export function SectionForm({ isOpen, onOpenChange, onSave, existingSectionNames }: SectionFormProps) {
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [customSection, setCustomSection] = useState('');
  const [availableSections, setAvailableSections] = useState(initialAvailableSections);

  useEffect(() => {
    if (isOpen) {
      setSelectedSections([]);
      setCustomSection('');
      setAvailableSections(initialAvailableSections);
    }
  }, [isOpen]);

  const toggleSectionSelection = (sectionName: string) => {
    setSelectedSections(prev =>
      prev.includes(sectionName)
        ? prev.filter(s => s !== sectionName)
        : [...prev, sectionName]
    );
  };
  
  const handleAddCustomSection = () => {
    const newSection = customSection.trim().toUpperCase();
    if (newSection && !availableSections.includes(newSection) && !existingSectionNames.includes(newSection)) {
      setAvailableSections(prev => [...prev, newSection]);
      setSelectedSections(prev => [...prev, newSection]);
      setCustomSection('');
    }
  };

  const handleSubmit = () => {
    onSave(selectedSections);
  };

  const filteredSections = availableSections.filter(s => !existingSectionNames.includes(s));

  return (
    <ResponsiveDialog open={isOpen} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-[425px]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Crear Nuevas Secciones</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Seleccione una o más secciones para añadirlas al grado, o añada una nueva.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Secciones Disponibles</Label>
            <div className="grid grid-cols-4 gap-2">
              {filteredSections.map(s => (
                <Button
                  key={s}
                  type="button"
                  variant={selectedSections.includes(s) ? 'default' : 'outline'}
                  onClick={() => toggleSectionSelection(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
             <Label htmlFor="custom-section">Añadir Otra Sección</Label>
            <div className="flex items-center gap-2">
              <Input
                id="custom-section"
                value={customSection}
                onChange={(e) => setCustomSection(e.target.value)}
                placeholder="p. ej. I"
              />
              <Button type="button" size="icon" variant="outline" onClick={handleAddCustomSection} disabled={!customSection.trim()}>
                <Plus className="h-4 w-4" />
                 <span className="sr-only">Añadir Sección</span>
              </Button>
            </div>
          </div>
        </div>
        <ResponsiveDialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="button" onClick={handleSubmit} disabled={selectedSections.length === 0}>
            Crear Secciones
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
