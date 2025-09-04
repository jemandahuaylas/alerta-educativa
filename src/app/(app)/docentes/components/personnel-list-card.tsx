"use client";

import { MoreVertical, FileText, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ResponsiveDropdownMenu, ResponsiveDropdownMenuContent, ResponsiveDropdownMenuItem, ResponsiveDropdownMenuLabel, ResponsiveDropdownMenuTrigger, ResponsiveDropdownMenuSeparator } from '@/components/ui/responsive-dropdown-menu';
import type { UserProfile } from '@/core/domain/types';

export const PersonnelListCard = ({ 
    item: person,
    onEdit,
    onDelete,
    onViewDetails,
}: { 
    item: UserProfile;
    onEdit: (person: UserProfile) => void;
    onDelete: (person: UserProfile) => void;
    onViewDetails: (person: UserProfile) => void;
}) => (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
        <div className="p-2 pr-4 grid grid-cols-[auto,1fr,auto] items-center gap-4">
            <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold">
              {person.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{person.name}</p>
                <p className="text-xs text-muted-foreground">{person.role} - DNI: {person.dni}</p>
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
                <ResponsiveDropdownMenuItem onSelect={(e) => {e.preventDefault(); onViewDetails(person)}}>
                    <FileText className="mr-2 h-4 w-4" /> Ver Detalles
                </ResponsiveDropdownMenuItem>
                <ResponsiveDropdownMenuSeparator />
                <ResponsiveDropdownMenuItem onSelect={(e) => {e.preventDefault(); onEdit(person)}}>
                    <Edit className="mr-2 h-4 w-4" /> Editar
                </ResponsiveDropdownMenuItem>
                <ResponsiveDropdownMenuItem onSelect={(e) => {e.preventDefault(); onDelete(person)}} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                </ResponsiveDropdownMenuItem>
              </ResponsiveDropdownMenuContent>
            </ResponsiveDropdownMenu>
        </div>
    </Card>
);