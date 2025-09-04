
"use client";

import { useState, useEffect } from 'react';
import { Search, UserPlus, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogDescription, ResponsiveDialogFooter, ResponsiveDialogHeader, ResponsiveDialogTitle } from '@/components/ui/responsive-dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { UserProfile } from '@/core/domain/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

type AsignarDocenteModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  teachers: UserProfile[];
  onAssign: (teachers: UserProfile[]) => void;
  gradeName: string;
  sectionName: string;
};

export function AsignarDocenteModal({
  isOpen,
  onOpenChange,
  teachers,
  onAssign,
  gradeName,
  sectionName,
}: AsignarDocenteModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeachers, setSelectedTeachers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    } else {
       setSearchQuery('');
       setSelectedTeachers([]);
    }
  }, [isOpen]);


  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.dni?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleToggleTeacher = (teacher: UserProfile) => {
    setSelectedTeachers(prev => 
      prev.some(t => t.id === teacher.id)
        ? prev.filter(t => t.id !== teacher.id)
        : [...prev, teacher]
    );
  };

  const handleAssignClick = async () => {
    await onAssign(selectedTeachers);
    setSelectedTeachers([]);
  };

  return (
    <ResponsiveDialog open={isOpen} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Asignar Personal a {gradeName} - Sección {sectionName}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Busque y seleccione uno o más docentes o auxiliares para asignar a esta sección.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre o DNI..."
            className="w-full rounded-lg bg-background pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <ScrollArea className="h-72">
          <div className="space-y-1 pr-4">
            {isLoading ? (
               <div className="space-y-4 pt-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="h-5 w-5 rounded-sm" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
                filteredTeachers.map(teacher => (
                <Label 
                    key={teacher.id} 
                    htmlFor={`teacher-${teacher.id}`}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer"
                >
                    <div className="flex items-center gap-3">
                        <Checkbox
                        id={`teacher-${teacher.id}`}
                        checked={selectedTeachers.some(t => t.id === teacher.id)}
                        onCheckedChange={() => handleToggleTeacher(teacher)}
                        />
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                           <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">{teacher.name}</p>
                            <p className="text-xs text-muted-foreground">{teacher.role}</p>
                        </div>
                    </div>
                </Label>
                ))
            )}
          </div>
        </ScrollArea>
        <ResponsiveDialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleAssignClick} disabled={selectedTeachers.length === 0}>
            <UserPlus className="mr-2 h-4 w-4" />
            Asignar {selectedTeachers.length > 0 ? `(${selectedTeachers.length})` : ''}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
