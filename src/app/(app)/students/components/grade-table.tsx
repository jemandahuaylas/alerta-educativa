"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Users, BookOpen, MoreVertical, Edit, Trash2, Plus, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResponsiveDropdownMenu, ResponsiveDropdownMenuContent, ResponsiveDropdownMenuItem, ResponsiveDropdownMenuLabel, ResponsiveDropdownMenuTrigger } from "@/components/ui/responsive-dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { Grade, Section } from '@/core/domain/types';
import { useStudents } from '@/hooks/use-students';

type GradeTableProps = {
  grade: Grade;
  sections: Section[];
  isRestrictedUser: boolean;
  onEditGrade: (grade: Grade) => void;
  onDeleteGrade: (gradeId: string) => void;
  onAddSection: (gradeId: string) => void;
  onEditSection: (section: Section) => void;
  onDeleteSection: (sectionId: string) => void;
};

export default function GradeTable({
  grade,
  sections,
  isRestrictedUser,
  onEditGrade,
  onDeleteGrade,
  onAddSection,
  onEditSection,
  onDeleteSection,
}: GradeTableProps) {
  const { students } = useStudents();
  const totalStudents = students.filter(student => student.gradeId === grade.id).length;
  const [isExpanded, setIsExpanded] = useState(false);

  const getSectionStudentCount = (sectionId: string) => {
    return students.filter(student => student.sectionId === sectionId).length;
  };

  return (
    <>
      <TableRow className="hover:bg-muted/50 border-b">
        <TableCell className="font-medium">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 h-6 w-6"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/10">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold">{grade.name}</span>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{totalStudents}</span>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="secondary">
            {sections.length} {sections.length === 1 ? 'sección' : 'secciones'}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            {!isRestrictedUser && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddSection(grade.id)}
                  className="h-8 px-2"
                >
                  <Plus className="h-4 w-4" />
                  <span className="ml-1 hidden sm:inline">Sección</span>
                </Button>
                <ResponsiveDropdownMenu>
                  <ResponsiveDropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </ResponsiveDropdownMenuTrigger>
                  <ResponsiveDropdownMenuContent align="end">
                    <ResponsiveDropdownMenuLabel>Acciones</ResponsiveDropdownMenuLabel>
                    <ResponsiveDropdownMenuItem onClick={() => onEditGrade(grade)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar grado
                    </ResponsiveDropdownMenuItem>
                    <ResponsiveDropdownMenuItem 
                      onClick={() => onDeleteGrade(grade.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar grado
                    </ResponsiveDropdownMenuItem>
                  </ResponsiveDropdownMenuContent>
                </ResponsiveDropdownMenu>
              </>
            )}
          </div>
        </TableCell>
      </TableRow>
      
      {isExpanded && sections.length > 0 && (
        sections.map((section) => {
          const sectionStudentCount = getSectionStudentCount(section.id);
          return (
            <TableRow key={section.id} className="bg-muted/20 hover:bg-muted/40">
              <TableCell className="pl-12">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary/60"></div>
                  <span className="text-sm font-medium">{section.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm">{sectionStudentCount}</span>
                </div>
              </TableCell>
              <TableCell>
                <Link href={`/students?gradeId=${grade.id}&sectionId=${section.id}`}>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                    Ver estudiantes
                  </Button>
                </Link>
              </TableCell>
              <TableCell className="text-right">
                {!isRestrictedUser && (
                  <ResponsiveDropdownMenu>
                    <ResponsiveDropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </ResponsiveDropdownMenuTrigger>
                    <ResponsiveDropdownMenuContent align="end">
                      <ResponsiveDropdownMenuLabel>Acciones</ResponsiveDropdownMenuLabel>
                      <ResponsiveDropdownMenuItem onClick={() => onEditSection(section)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar sección
                      </ResponsiveDropdownMenuItem>
                      <ResponsiveDropdownMenuItem 
                        onClick={() => onDeleteSection(section.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar sección
                      </ResponsiveDropdownMenuItem>
                    </ResponsiveDropdownMenuContent>
                  </ResponsiveDropdownMenu>
                )}
              </TableCell>
            </TableRow>
          );
        })
      )}
      
      {isExpanded && sections.length === 0 && (
        <TableRow className="bg-muted/10">
          <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <BookOpen className="h-8 w-8 text-muted-foreground/50" />
              <p>No hay secciones en este grado</p>
              {!isRestrictedUser && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddSection(grade.id)}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear primera sección
                </Button>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}