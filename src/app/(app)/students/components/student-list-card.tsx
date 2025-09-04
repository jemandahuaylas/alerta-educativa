"use client";

import { useState } from 'react';
import { MoreVertical, FileText, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ResponsiveDropdownMenu, ResponsiveDropdownMenuContent, ResponsiveDropdownMenuItem, ResponsiveDropdownMenuLabel, ResponsiveDropdownMenuTrigger } from '@/components/ui/responsive-dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { Student } from '@/core/domain/types';

export const StudentListCard = ({ 
    item: student,
    index,
    onEdit,
    onDelete 
}: { 
    item: Student;
    index: number;
    onEdit: (student: Student) => void;
    onDelete: (studentId: string) => void;
}) => {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    return (
        <>
            <Card className="shadow-sm hover:shadow-md transition-shadow">
                <div className="p-2 pr-4 grid grid-cols-[auto,1fr,auto] items-center gap-4">
                    <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{student.lastName}, {student.firstName}</p>
                        <p className="text-xs text-muted-foreground">DNI: {student.dni}</p>
                    </div>
                    <ResponsiveDropdownMenu>
                      <ResponsiveDropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </ResponsiveDropdownMenuTrigger>
                      <ResponsiveDropdownMenuContent>
                        <ResponsiveDropdownMenuLabel>Acciones</ResponsiveDropdownMenuLabel>
                        <ResponsiveDropdownMenuItem onSelect={(e) => { e.preventDefault(); onEdit(student); }}>
                            <Pencil className="mr-2 h-4 w-4" /> Editar
                        </ResponsiveDropdownMenuItem>
                        <ResponsiveDropdownMenuItem onSelect={(e) => { e.preventDefault(); setIsDeleteDialogOpen(true); }} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </ResponsiveDropdownMenuItem>
                      </ResponsiveDropdownMenuContent>
                    </ResponsiveDropdownMenu>
                </div>
            </Card>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente el registro del estudiante.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(student.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};