"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Users, BookOpen, MoreVertical, Edit, Trash2, Plus, ChevronRight, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResponsiveDropdownMenu, ResponsiveDropdownMenuContent, ResponsiveDropdownMenuItem, ResponsiveDropdownMenuLabel, ResponsiveDropdownMenuTrigger } from "@/components/ui/responsive-dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { Grade, Section } from '@/core/domain/types';
import { useStudents } from '@/hooks/use-students';

type GradeGridCardProps = {
  grade: Grade;
  sections: Section[];
  isRestrictedUser: boolean;
  onEditGrade: (grade: Grade) => void;
  onDeleteGrade: (gradeId: string) => void;
  onAddSection: (gradeId: string) => void;
};

export default function GradeGridCard({
  grade,
  sections,
  isRestrictedUser,
  onEditGrade,
  onDeleteGrade,
  onAddSection,
}: GradeGridCardProps) {
  const { students } = useStudents();
  const totalStudents = students.filter(student => student.gradeId === grade.id).length;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="relative group hover:shadow-lg transition-all duration-200 border-2 border-transparent hover:border-primary/20 h-full w-full max-w-full overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="flex-row items-center justify-between pb-3 cursor-pointer hover:bg-accent/50 transition-colors rounded-t-lg">
            <div className="flex items-center gap-2 flex-1">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold">{grade.name}</CardTitle>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{totalStudents}</span>
                  </div>
                  <div>
                    {sections.length} sec.
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isRestrictedUser && (
                <ResponsiveDropdownMenu>
                  <ResponsiveDropdownMenuTrigger asChild>
                    <Button 
                      aria-haspopup="true" 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </ResponsiveDropdownMenuTrigger>
                  <ResponsiveDropdownMenuContent>
                    <ResponsiveDropdownMenuLabel>Acciones de Grado</ResponsiveDropdownMenuLabel>
                    <ResponsiveDropdownMenuItem onSelect={(e) => { e.preventDefault(); onEditGrade(grade); }}>
                      <Edit className="mr-2 h-4 w-4" /> Editar
                    </ResponsiveDropdownMenuItem>
                    <ResponsiveDropdownMenuItem onSelect={(e) => { e.preventDefault(); onAddSection(grade.id); }}>
                      <Plus className="mr-2 h-4 w-4" /> Agregar Sección
                    </ResponsiveDropdownMenuItem>
                    <ResponsiveDropdownMenuItem onSelect={(e) => { e.preventDefault(); onDeleteGrade(grade.id); }} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                    </ResponsiveDropdownMenuItem>
                  </ResponsiveDropdownMenuContent>
                </ResponsiveDropdownMenu>
              )}
              <ChevronDown className={cn(
                "h-5 w-5 text-muted-foreground transition-transform duration-200",
                isOpen && "rotate-180"
              )} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1">
          {sections.length > 0 ? (
            <CardContent className="pt-0 pb-4">
              <div className="space-y-3">
                <div className="px-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Secciones disponibles:</h4>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {sections.map((section) => {
                    const sectionStudents = students.filter(student => 
                      student.gradeId === grade.id && student.sectionId === section.id
                    ).length;
                    
                    return (
                      <Link 
                        key={section.id} 
                        href={`/students/section/${grade.id}/${section.id}`}
                        className="block"
                      >
                        <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/80 transition-all duration-200 hover:shadow-sm active:scale-[0.98]">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                              {section.name}
                            </div>
                            <div>
                              <div className="text-sm font-medium">Sección {section.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {sectionStudents} estudiante{sectionStudents !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {sectionStudents}
                            </Badge>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          ) : (
            <CardContent className="pt-0 pb-4">
              <div className="text-center py-6 border-2 border-dashed border-muted rounded-lg mx-1">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 rounded-full bg-muted">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">No hay secciones</p>
                    <p className="text-xs text-muted-foreground">Este grado aún no tiene secciones creadas</p>
                  </div>
                  {!isRestrictedUser && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddSection(grade.id);
                      }}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Crear primera sección
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          )}
        </CollapsibleContent>
       </Card>
     </Collapsible>
   );
 }