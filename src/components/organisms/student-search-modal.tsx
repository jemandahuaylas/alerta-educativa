
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Search, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogDescription, ResponsiveDialogFooter, ResponsiveDialogHeader, ResponsiveDialogTitle } from '@/components/ui/responsive-dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Student } from '@/core/domain/types';
import { supabase } from '@/lib/supabase/client';
import { useDebounce } from '@/hooks/use-debounce';
import { useKeyboardScrollViewport } from '@/hooks/use-keyboard-scroll';

type StudentSearchModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSelectStudent: (student: Student) => void;
};

export function StudentSearchModal({ isOpen, onOpenChange, onSelectStudent }: StudentSearchModalProps) {
  const containerRef = useKeyboardScrollViewport();
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const searchStudents = useCallback(async (query: string) => {
    if (query.length < 3) {
      setStudents([]);
      return;
    }
    setIsLoading(true);
    
    // Search by name, last name, or DNI
    const { data, error } = await supabase
        .from('students')
        .select(`
            id,
            first_name,
            last_name,
            dni,
            grade:grades ( name ),
            section:sections ( name )
        `)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,dni.ilike.%${query}%`)
        .limit(20);

    if (error) {
        console.error('Error searching students:', error);
        setStudents([]);
    } else {
        const formattedResults = data.map((s: any) => ({
          id: s.id,
          first_name: s.first_name,
          last_name: s.last_name,
          firstName: s.first_name,
          lastName: s.last_name,
          name: `${s.first_name} ${s.last_name}`,
          dni: s.dni,
          grade: s.grade?.name ?? 'N/A',
          section: s.section?.name ?? 'N/A',
          gradeId: '', // These are not available from this query but might be needed
          sectionId: '', // depending on how the Student type is used elsewhere.
        }));
        setStudents(formattedResults);
    }
    setIsLoading(false);
  }, []);
  
  useEffect(() => {
    searchStudents(debouncedSearchQuery);
  }, [debouncedSearchQuery, searchStudents]);
  
  // Clear search results when modal is closed
  useEffect(() => {
    if (!isOpen) {
        setSearchQuery('');
        setStudents([]);
    }
  }, [isOpen]);

  return (
    <ResponsiveDialog open={isOpen} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent ref={containerRef} className="sm:max-w-[500px]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Seleccionar Estudiante</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Busque por nombre, apellido o DNI (mínimo 3 caracteres).
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre, apellido o DNI..."
            className="w-full rounded-lg bg-background pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>
        <ScrollArea className="h-72">
          <div className="space-y-1 pr-4">
            {isLoading ? (
                <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : students.length > 0 ? (
                students.map(student => (
                <div 
                    key={student.id} 
                    onClick={() => onSelectStudent(student)}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer"
                >
                    <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm font-medium">{student.name}</p>
                            <p className="text-xs text-muted-foreground">{student.grade} - Sección {student.section}</p>
                        </div>
                    </div>
                </div>
                ))
            ) : (
                <p className="text-center text-sm text-muted-foreground p-8">
                    {debouncedSearchQuery.length < 3 ? 'Escriba para buscar...' : 'No se encontraron estudiantes.'}
                </p>
            )}
          </div>
        </ScrollArea>
        <ResponsiveDialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
