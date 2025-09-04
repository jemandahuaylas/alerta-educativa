"use client";

import { useState, useMemo } from 'react';
import { CalendarDays, User, FileText, FileSpreadsheet, CheckCircle, Search, Filter, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogDescription, ResponsiveDialogFooter, ResponsiveDialogHeader, ResponsiveDialogTitle } from '@/components/ui/responsive-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Student, Incident } from '@/core/domain/types';
import type { IncidentWithStudentInfo } from '@/hooks/use-incidents';
import { useIncidents } from '@/hooks/use-incidents';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { useAppContext } from '@/context/app-context';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

type FollowUpModalProps = {
  incident: Incident;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

function FollowUpModal({ incident, isOpen, onOpenChange }: FollowUpModalProps) {
    const { updateIncidentStatus } = useIncidents();
    const { toast } = useToast();
    const [notes, setNotes] = useState('');
    const { currentUserProfile } = useAppContext();

    const handleSave = async () => {
        if (!currentUserProfile) return;
        await updateIncidentStatus(incident.id, 'Atendido', notes, currentUserProfile.id);
        toast({
            title: "Incidente Atendido",
            description: "El incidente ha sido marcado como atendido.",
        });
        onOpenChange(false);
    };
    
    return (
        <ResponsiveDialog open={isOpen} onOpenChange={onOpenChange}>
            <ResponsiveDialogContent>
                <ResponsiveDialogHeader>
                    <ResponsiveDialogTitle>Seguimiento de Incidente</ResponsiveDialogTitle>
                    <ResponsiveDialogDescription>
                        Añada notas de seguimiento para marcar este incidente como atendido.
                    </ResponsiveDialogDescription>
                </ResponsiveDialogHeader>
                <div className="space-y-2 py-4">
                    <Label htmlFor="follow-up-notes">Notas de Seguimiento (Opcional)</Label>
                    <Textarea
                        id="follow-up-notes"
                        placeholder="Describa las acciones tomadas..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>
                <ResponsiveDialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSave}>Marcar como Atendido</Button>
                </ResponsiveDialogFooter>
            </ResponsiveDialogContent>
        </ResponsiveDialog>
    );
}


type IncidentHistoryModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  student: Student | null;
  incidents: IncidentWithStudentInfo[];
};

export function IncidentHistoryModal({
  isOpen,
  onOpenChange,
  student,
  incidents,
}: IncidentHistoryModalProps) {
  
  const [followUpIncident, setFollowUpIncident] = useState<Incident | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedIncidents, setExpandedIncidents] = useState<Set<string>>(new Set());
  const { currentUserProfile } = useAppContext();
  
  const toggleIncidentExpansion = (incidentId: string) => {
    setExpandedIncidents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(incidentId)) {
        newSet.delete(incidentId);
      } else {
        newSet.add(incidentId);
      }
      return newSet;
    });
  };
  
  const ITEMS_PER_PAGE = 10;
  const LARGE_DATASET_THRESHOLD = 100;
  
  // Filtros y búsqueda inteligente
  const filteredIncidents = useMemo(() => {
    return incidents.filter(incident => {
      const searchMatch = searchQuery === '' || 
        incident.incidentTypes.some(type => type.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (incident.registeredBy && incident.registeredBy.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (incident.followUpNotes && incident.followUpNotes.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const statusMatch = statusFilter === 'all' || incident.status === statusFilter;
      
      return searchMatch && statusMatch;
    });
  }, [incidents, searchQuery, statusFilter]);
  
  // Paginación inteligente - solo se activa con más de 100 incidentes
  const shouldUsePagination = incidents.length > LARGE_DATASET_THRESHOLD;
  
  const paginatedIncidents = useMemo(() => {
    if (!shouldUsePagination) return filteredIncidents;
    
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredIncidents.slice(startIndex, endIndex);
  }, [filteredIncidents, currentPage, shouldUsePagination]);
  
  const totalPages = Math.ceil(filteredIncidents.length / ITEMS_PER_PAGE);
  
  const handleDownloadPDF = () => {
    if (!student) return;
    
    const doc = new jsPDF();
    const appName = "Alerta Educativa";
    const institutionName = "Mi Institución Educativa";
    const reportTitle = `Historial de Incidentes - ${student.name}`;
    const fullTitle = `${appName} - ${reportTitle}`;
    
    // Encabezado
    doc.setFontSize(16);
    doc.text(fullTitle, 14, 15);
    doc.setFontSize(10);
    doc.text(institutionName, 14, 21);
    doc.text(`${student.grade}, Sección ${student.section}`, 14, 27);
    doc.text(`Total de incidentes: ${filteredIncidents.length}`, 14, 33);
    
    // Datos para la tabla
    const data = filteredIncidents.map(incident => [
      new Date(incident.date).toLocaleDateString('es-ES', { timeZone: 'UTC' }),
      incident.incidentTypes.join(', '),
      incident.status,
      incident.registeredBy || 'Sistema',
      incident.followUpNotes ? incident.followUpNotes.substring(0, 50) + '...' : '-'
    ]);
    
    // Tabla
    (doc as any).autoTable({
      startY: 40,
      head: [['Fecha', 'Tipos de Incidente', 'Estado', 'Registrado por', 'Notas']],
      body: data,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });
    
    const fileName = `Historial_Incidentes_${student.name.replace(/\s+/g, '_')}_${appName}`.replace(/\s+/g, '_');
    doc.save(`${fileName}.pdf`);
  };

  const handleDownloadExcel = () => {
    if (!student) return;
    
    const appName = "Alerta Educativa";
    const institutionName = "Mi Institución Educativa";
    const reportTitle = `Historial de Incidentes - ${student.name}`;
    const fullTitle = `${appName} - ${reportTitle}`;
    
    const data = filteredIncidents.map(incident => [
      new Date(incident.date).toLocaleDateString('es-ES', { timeZone: 'UTC' }),
      incident.incidentTypes.join(', '),
      incident.status,
      incident.registeredBy || 'Sistema',
      incident.attendedBy || '-',
      incident.attendedDate ? new Date(incident.attendedDate).toLocaleDateString('es-ES', { timeZone: 'UTC' }) : '-',
      incident.followUpNotes || '-'
    ]);
    
    const worksheet = XLSX.utils.aoa_to_sheet([
      [fullTitle],
      [institutionName],
      [`${student.grade}, Sección ${student.section}`],
      [`Total de incidentes: ${filteredIncidents.length}`],
      [],
      ['Fecha', 'Tipos de Incidente', 'Estado', 'Registrado por', 'Atendido por', 'Fecha de Atención', 'Notas de Seguimiento']
    ].concat(data));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Historial Incidentes');
    
    const fileName = `Historial_Incidentes_${student.name.replace(/\s+/g, '_')}_${appName}`.replace(/\s+/g, '_');
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };
  
  const getStatusVariant = (status: string) => {
    switch(status) {
        case 'Atendido': return 'default';
        case 'Pendiente': return 'destructive';
        default: return 'secondary';
    }
  }

  const canApprove = currentUserProfile?.role !== 'Docente' && currentUserProfile?.role !== 'Auxiliar';

  return (
    <>
      <ResponsiveDialog open={isOpen} onOpenChange={onOpenChange}>
        <ResponsiveDialogContent className="sm:max-w-2xl p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
          <ResponsiveDialogHeader className="p-6 flex-row items-center justify-between">
              {student && (
                  <div>
                      <ResponsiveDialogTitle>{student.name}</ResponsiveDialogTitle>
                      <ResponsiveDialogDescription>
                          {student.grade}, Sección {student.section} • {filteredIncidents.length} incidente{filteredIncidents.length !== 1 ? 's' : ''}
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
          
          {/* Controles inteligentes - solo se muestran con muchos incidentes */}
          {incidents.length > 10 && (
            <div className="px-6 pb-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar en incidentes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                    <SelectItem value="Atendido">Atendido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {shouldUsePagination && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredIncidents.length)} de {filteredIncidents.length}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="px-2">{currentPage} de {totalPages}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="px-6 pb-6">
          {filteredIncidents.length > 0 ? (
            <>
              <ScrollArea className={`${shouldUsePagination ? 'max-h-96' : 'max-h-[70vh]'} -mx-6 scroll-smooth`}>
                  <div className="space-y-4 px-6">
                  {paginatedIncidents.map((incident) => {
                    const isExpanded = expandedIncidents.has(incident.id);
                    return (
                      <Card key={incident.id} className="shadow-sm transition-all duration-200 hover:shadow-md">
                      <CardHeader 
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-4 pb-2 cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => toggleIncidentExpansion(incident.id)}
                      >
                          <div className="flex flex-wrap gap-2 flex-1">
                              {Array.isArray(incident.incidentTypes) &&
                                  incident.incidentTypes.map(type => (
                                      <Badge key={type} variant="secondary">{type}</Badge>
                                  ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusVariant(incident.status)} className="self-start sm:self-auto">{incident.status}</Badge>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                      </CardHeader>
                      {isExpanded && (
                        <CardContent className="p-4 pt-2 animate-in slide-in-from-top-2 duration-200">
                             <div className="text-xs text-muted-foreground space-y-2">
                                  <div className="flex items-center gap-2">
                                      <User className="h-3 w-3" />
                                      <span>Registrado por: {incident.registeredBy || 'Sistema'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <CalendarDays className="h-3 w-3" />
                                      <time dateTime={incident.date}>
                                          {new Date(incident.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                                      </time>
                                  </div>
                             </div>
                            {incident.status === 'Atendido' && (
                              <div className="mt-4 space-y-2 text-xs">
                                  {incident.attendedBy && (
                                       <div className="flex items-center gap-2 text-muted-foreground">
                                          <User className="h-3 w-3" />
                                          <span>Atendido por: {incident.attendedBy}</span>
                                      </div>
                                  )}
                                  {incident.attendedDate && (
                                       <div className="flex items-center gap-2 text-muted-foreground">
                                          <CalendarDays className="h-3 w-3" />
                                          <span>Fecha de atención: {new Date(incident.attendedDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</span>
                                      </div>
                                  )}
                                  {incident.followUpNotes && (
                                    <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md mt-2">
                                        <p className="font-semibold text-foreground mb-1 text-xs">Notas de Seguimiento:</p>
                                        <p className="whitespace-pre-wrap">{incident.followUpNotes}</p>
                                    </div>
                                  )}
                              </div>
                            )}
                        </CardContent>
                      )}
                       {isExpanded && incident.status === 'Pendiente' && canApprove && (
                        <CardFooter className="p-4 pt-0 border-t animate-in slide-in-from-top-2 duration-200">
                            <Button 
                              size="sm" 
                              className="w-full" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setFollowUpIncident(incident);
                              }}
                            >
                                <CheckCircle className="mr-2 h-4 w-4"/>
                                Marcar como Atendido
                            </Button>
                        </CardFooter>
                       )}
                      </Card>
                    );
                  })}
                  </div>
              </ScrollArea>
              </>
          ) : (
              <p className="text-center text-sm text-muted-foreground py-10">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'No hay incidentes que coincidan con los filtros aplicados.'
                    : 'No hay incidentes registrados para este estudiante.'}
              </p>
          )}
          </div>
          
          <ResponsiveDialogFooter className="p-4 border-t bg-background">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="ml-auto">
                Cerrar
              </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {followUpIncident && (
        <FollowUpModal 
            isOpen={!!followUpIncident}
            onOpenChange={() => setFollowUpIncident(null)}
            incident={followUpIncident}
        />
      )}
    </>
  );
}
