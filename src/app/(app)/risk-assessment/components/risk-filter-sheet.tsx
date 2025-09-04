"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { RiskFactor } from '@/core/domain/types';

type RiskFilterSheetProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  riskCategoriesWithCounts: { type: RiskFactor['category']; count: number; display: string }[];
  riskLevelsWithCounts: { type: RiskFactor['level']; count: number; display: string }[];
  selectedCategories: string[];
  selectedLevels: string[];
  onApply: (filters: { categories: string[]; levels: string[] }) => void;
};

export function RiskFilterSheet({
  isOpen,
  onOpenChange,
  riskCategoriesWithCounts,
  riskLevelsWithCounts,
  selectedCategories,
  selectedLevels,
  onApply,
}: RiskFilterSheetProps) {
  const [currentCategories, setCurrentCategories] = useState<string[]>(selectedCategories);
  const [currentLevels, setCurrentLevels] = useState<string[]>(selectedLevels);

  useEffect(() => {
    if (isOpen) {
      setCurrentCategories(selectedCategories);
      setCurrentLevels(selectedLevels);
    }
  }, [selectedCategories, selectedLevels, isOpen]);

  const handleToggleCategory = (type: string) => {
    setCurrentCategories(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleToggleLevel = (type: string) => {
    setCurrentLevels(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleClearFilters = () => {
    setCurrentCategories([]);
    setCurrentLevels([]);
  };

  const handleApplyClick = () => {
    onApply({ categories: currentCategories, levels: currentLevels });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Filtrar por Riesgo</SheetTitle>
          <SheetDescription>
            Seleccione categorías o niveles para filtrar la lista de estudiantes.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-grow my-4">
          <div className="space-y-6 pr-6">
            <div>
              <h4 className="text-sm font-semibold mb-3">Categoría de Riesgo</h4>
              <div className="space-y-3">
                {riskCategoriesWithCounts.map(({ type, count, display }) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`filter-cat-${type}`}
                      checked={currentCategories.includes(type)}
                      onCheckedChange={() => handleToggleCategory(type)}
                    />
                    <Label
                      htmlFor={`filter-cat-${type}`}
                      className="w-full cursor-pointer rounded-md p-2 hover:bg-accent -my-2 -ml-2 flex items-center justify-between"
                    >
                      <span>{display}</span>
                      <Badge variant="secondary" className="font-mono">{count}</Badge>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-semibold mb-3">Nivel de Riesgo</h4>
              <div className="space-y-3">
                {riskLevelsWithCounts.map(({ type, count, display }) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`filter-lvl-${type}`}
                      checked={currentLevels.includes(type)}
                      onCheckedChange={() => handleToggleLevel(type)}
                    />
                    <Label
                      htmlFor={`filter-lvl-${type}`}
                      className="w-full cursor-pointer rounded-md p-2 hover:bg-accent -my-2 -ml-2 flex items-center justify-between"
                    >
                      <span>{display}</span>
                      <Badge variant="secondary" className="font-mono">{count}</Badge>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
        <SheetFooter className="pt-4 border-t flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleClearFilters}
            disabled={currentCategories.length === 0 && currentLevels.length === 0}
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
