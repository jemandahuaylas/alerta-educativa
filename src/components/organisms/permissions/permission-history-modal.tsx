
"use client";

import { useState, useMemo } from 'react';
import { CalendarDays, FileText, FileSpreadsheet, Check, X, Search, Filter, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogDescription, ResponsiveDialogFooter, ResponsiveDialogHeader, ResponsiveDialogTitle } from '@/components/ui/responsive-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Student, Permission } from '@/core/domain/types';
import { usePermissions } from '@/hooks/use-permissions';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/app-context';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

type PermissionHistoryModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  student: Student | null;
  permissions: Permission[];
};

const ITEMS_PER_PAGE = 10;
const LARGE_DATASET_THRESHOLD = 100;

export function PermissionHistoryModal({
  isOpen,
  onOpenChange,
  student,
  permissions,
}: PermissionHistoryModalProps) {
  
  const { updatePermissionStatus } = usePermissions();
  const { toast } = useToast();
  const { currentUserProfile } = useAppContext();
  
  // State for smart functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedPermissions, setExpandedPermissions] = useState<Set<string>>(new Set());

  const handleDownloadPDF = () => {
    if (!student) return;
    
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Reporte de Permisos', 20, 20);
    
    // Student info
    doc.setFontSize(12);
    doc.text(`Estudiante: ${student.name}`, 20, 35);
    doc.text(`Grado: ${student.grade}, Sección: ${student.section}`, 20, 45);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 20, 55);
    
    // Permissions table
    const tableData = filteredPermissions.map(permission => [
      permission.permissionTypes.join(', '),
      new Date(permission.requestDate).toLocaleDateString('es-ES'),
      permission.status
    ]);
    
    (doc as any).autoTable({
      head: [['Tipos de Permiso', 'Fecha de Solicitud', 'Estado']],
      body: tableData,
      startY: 65,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] }
    });
    
    doc.save(`permisos_${student.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleDownloadExcel = () => {
    if (!student) return;
    
    const worksheetData = [
      ['Reporte de Permisos'],
      [''],
      ['Estudiante:', student.name],
      ['Grado:', student.grade],
      ['Sección:', student.section],
      ['Fecha de generación:', new Date().toLocaleDateString('es-ES')],
      [''],
      ['Tipos de Permiso', 'Fecha de Solicitud', 'Estado']
    ];
    
    filteredPermissions.forEach(permission => {
      worksheetData.push([
        permission.permissionTypes.join(', '),
        new Date(permission.requestDate).toLocaleDateString('es-ES'),
        permission.status
      ]);
    });
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Permisos');
    
    XLSX.writeFile(workbook, `permisos_${student?.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleStatusUpdate = async (permissionId: string, status: 'Aprobado' | 'Rechazado') => {
    await updatePermissionStatus(permissionId, status);
    toast({
        title: `Permiso ${status}`,
        description: `El permiso ha sido marcado como ${status.toLowerCase()}.`
    });
  };

  const getStatusVariant = (status: string) => {
    switch(status) {
        case 'Aprobado': return 'default';
        case 'Rechazado': return 'destructive';
        case 'Pendiente': return 'secondary';
        default: return 'outline';
    }
  }
  
  const canApprove = currentUserProfile?.role !== 'Docente';
  
  // Smart filtering and pagination
  const filteredPermissions = useMemo(() => {
    return permissions.filter(permission => {
      const matchesSearch = permission.permissionTypes.some(type => 
        type.toLowerCase().includes(searchQuery.toLowerCase())
      );
      const matchesStatus = statusFilter === 'all' || permission.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [permissions, searchQuery, statusFilter]);
  
  const paginatedPermissions = useMemo(() => {
    if (permissions.length <= LARGE_DATASET_THRESHOLD) {
      return filteredPermissions;
    }
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPermissions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPermissions, currentPage, permissions.length]);
  
  const totalPages = Math.ceil(filteredPermissions.length / ITEMS_PER_PAGE);
  const showPagination = permissions.length > LARGE_DATASET_THRESHOLD;
  const showControls = permissions.length > 10;
  
  const togglePermissionExpansion = (permissionId: string) => {
    setExpandedPermissions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId);
      } else {
        newSet.add(permissionId);
      }
      return newSet;
    });
  };

  return (
    <ResponsiveDialog open={isOpen} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-2xl p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
        <ResponsiveDialogHeader className="p-6 flex-row items-center justify-between">
            {student && (
                <div>
                    <ResponsiveDialogTitle>{student.name}</ResponsiveDialogTitle>
                    <ResponsiveDialogDescription>
                        {student.grade}, Sección {student.section}
                    </ResponsiveDialogDescription>
                </div>
            )}
             <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                    <FileText className="mr-2 h-4 w-4" />
                    PDF
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadExcel}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Excel
                </Button>
            </div>
        </ResponsiveDialogHeader>

        <div className="p-6">
          {showControls && (
            <div className="mb-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por tipo de permiso..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                    <SelectItem value="Aprobado">Aprobado</SelectItem>
                    <SelectItem value="Rechazado">Rechazado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{filteredPermissions.length} permiso{filteredPermissions.length !== 1 ? 's' : ''} encontrado{filteredPermissions.length !== 1 ? 's' : ''}</span>
                {showPagination && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
          
        {filteredPermissions.length > 0 ? (
          <ScrollArea className={`${showPagination ? 'max-h-[50vh]' : 'max-h-[70vh]'} -mx-6 scroll-smooth`}>
              <div className="space-y-4 px-6">
              {paginatedPermissions.map((permission) => {
                const isExpanded = expandedPermissions.has(permission.id);
                return (
                  <Card key={permission.id} className="shadow-sm transition-all duration-200 hover:shadow-md">
                    <CardHeader 
                      className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => togglePermissionExpansion(permission.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(permission.permissionTypes) && permission.permissionTypes.map((type) => (
                            <Badge key={type} variant="outline">{type}</Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusVariant(permission.status)}>{permission.status}</Badge>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    {isExpanded && (
                      <CardContent className="p-4 pt-0 animate-in slide-in-from-top-2 duration-200">
                        <time dateTime={permission.requestDate} className="text-xs text-muted-foreground flex items-center gap-2">
                          <CalendarDays className="h-3 w-3" />
                          Solicitado: {new Date(permission.requestDate).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            timeZone: 'UTC'
                          })}
                        </time>
                      </CardContent>
                    )}
                    
                    {isExpanded && permission.status === 'Pendiente' && canApprove && (
                      <CardFooter className="p-4 pt-0 border-t flex items-center justify-end gap-2 animate-in slide-in-from-top-2 duration-200">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate(permission.id, 'Rechazado');
                          }}
                        >
                          <X className="mr-2 h-4 w-4" /> Rechazar
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate(permission.id, 'Aprobado');
                          }}
                        >
                          <Check className="mr-2 h-4 w-4" /> Aprobar
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                );
              })}
              </div>
          </ScrollArea>
        ) : (
            <p className="text-center text-sm text-muted-foreground py-10">
                {searchQuery || statusFilter !== 'all' 
                  ? 'No se encontraron permisos que coincidan con los filtros.' 
                  : 'No hay permisos registrados para este estudiante.'}
            </p>
        )}
        </div>
        
        <ResponsiveDialogFooter className="p-4 bg-background border-t">
            <Button type="button" variant="outline" className="ml-auto" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
