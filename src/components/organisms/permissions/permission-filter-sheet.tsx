
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

type PermissionFilterSheetProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  permissionTypesWithCounts: { type: string; count: number }[];
  selectedTypes: string[];
  onApply: (selectedTypes: string[]) => void;
};

export function PermissionFilterSheet({
  isOpen,
  onOpenChange,
  permissionTypesWithCounts,
  selectedTypes,
  onApply,
}: PermissionFilterSheetProps) {
  const [currentSelection, setCurrentSelection] = useState<string[]>(selectedTypes);

  useEffect(() => {
    if (isOpen) {
      setCurrentSelection(selectedTypes);
    }
  }, [selectedTypes, isOpen]);

  const handleToggleType = (type: string) => {
    setCurrentSelection(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleClearFilters = () => {
    setCurrentSelection([]);
  };

  const handleApplyClick = () => {
    onApply(currentSelection);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Filtrar Permisos</SheetTitle>
          <SheetDescription>
            Seleccione uno o más tipos de permisos para filtrar la lista.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-grow my-4">
          <div className="space-y-3 pr-6">
            {permissionTypesWithCounts.map(({ type, count }) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={`filter-${type}`}
                  checked={currentSelection.includes(type)}
                  onCheckedChange={() => handleToggleType(type)}
                />
                <Label
                  htmlFor={`filter-${type}`}
                  className="w-full cursor-pointer rounded-md p-2 hover:bg-accent -my-2 -ml-2 flex items-center justify-between"
                >
                  <span>{type}</span>
                  <Badge variant="secondary" className="font-mono">{count}</Badge>
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>
        <SheetFooter className="pt-4 border-t flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={handleClearFilters}
            disabled={currentSelection.length === 0}
          >
            Limpiar filtros
          </Button>
          <div className="flex gap-2">
             <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
             <Button onClick={handleApplyClick}>Aplicar Filtros</Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
