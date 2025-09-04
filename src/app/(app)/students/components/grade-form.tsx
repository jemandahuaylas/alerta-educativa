
"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const initialAvailableGrades = ['1ro', '2do', '3ro', '4to', '5to', '6to'];

type GradeFormProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (grades: string[]) => void;
  existingGradeNames: string[];
};

export default function GradeForm({ isOpen, onOpenChange, onSave, existingGradeNames }: GradeFormProps) {
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [customGrade, setCustomGrade] = useState('');
  const [availableGrades, setAvailableGrades] = useState(() => 
    initialAvailableGrades.filter(g => !existingGradeNames.includes(g))
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedGrades([]);
      setCustomGrade('');
      setAvailableGrades(initialAvailableGrades.filter(g => !existingGradeNames.includes(g)));
    }
  }, [isOpen, existingGradeNames]);

  const toggleGradeSelection = (gradeName: string) => {
    setSelectedGrades(prev =>
      prev.includes(gradeName)
        ? prev.filter(g => g !== gradeName)
        : [...prev, gradeName]
    );
  };

  const handleAddCustomGrade = () => {
    const newGrade = customGrade.trim();
    if (newGrade && !availableGrades.includes(newGrade) && !existingGradeNames.includes(newGrade)) {
      setAvailableGrades(prev => [...prev, newGrade]);
      setSelectedGrades(prev => [...prev, newGrade]);
      setCustomGrade('');
    }
  };

  const handleSubmit = () => {
    onSave(selectedGrades);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={() => onOpenChange(false)}
    >
      {/* Modal */}
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
        >
          ×
        </button>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Crear Nuevos Grados</h2>
          <p className="text-sm text-gray-600 mt-1">
            Seleccione uno o más grados para añadirlos, o añada uno personalizado.
          </p>
        </div>

        <div className="space-y-6">
          {/* Grados Seleccionados */}
          {selectedGrades.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Grados Seleccionados ({selectedGrades.length})</Label>
              <div className="flex flex-wrap gap-2">
                {selectedGrades.map(grade => (
                  <Badge 
                    key={grade} 
                    variant="default" 
                    className="cursor-pointer hover:bg-primary/80"
                    onClick={() => toggleGradeSelection(grade)}
                  >
                    {grade}
                    <Check className="ml-1 h-3 w-3" />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Grados Disponibles */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Grados Disponibles</Label>
            <div className="grid grid-cols-3 gap-2">
              {availableGrades.map(grade => (
                <Button
                  key={grade}
                  variant={selectedGrades.includes(grade) ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-10 text-sm transition-all",
                    selectedGrades.includes(grade) 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  )}
                  onClick={() => toggleGradeSelection(grade)}
                >
                  {selectedGrades.includes(grade) && <Check className="mr-1 h-3 w-3" />}
                  {grade}
                </Button>
              ))}
            </div>
          </div>

          {/* Grado Personalizado */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Añadir Grado Personalizado</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ej: 7mo, Inicial, etc."
                value={customGrade}
                onChange={(e) => setCustomGrade(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomGrade()}
                className="flex-1"
              />
              <Button 
                onClick={handleAddCustomGrade}
                disabled={!customGrade.trim()}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={selectedGrades.length === 0}
          >
            Crear Grados ({selectedGrades.length})
          </Button>
        </div>
      </div>
    </div>
  );
}
