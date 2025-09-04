"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Student, Incident, Permission, NEE, Dropout } from '@/core/domain/types';
import { History, Eye } from 'lucide-react';
import { useIncidents } from '@/hooks/use-incidents';
import { usePermissions } from '@/hooks/use-permissions';
import { useNee } from '@/hooks/use-nee';
import { useDesertion } from '@/hooks/use-desertion';
import { Badge } from '@/components/ui/badge';
import { Button } from '../ui/button';
import { StudentHistoryModal } from './student-history-modal';
import type { HistoryItem } from './student-history-modal';

const mapIncidentsToHistory = (incidents: Incident[]): HistoryItem[] => 
    incidents.map(i => ({
        id: i.id,
        type: 'Incidente',
        date: i.date,
        description: `Registrado por ${i.registeredBy ?? 'Sistema'}`,
        tags: i.incidentTypes
    }));

const mapPermissionsToHistory = (permissions: Permission[]): HistoryItem[] =>
    permissions.map(p => ({
        id: p.id,
        type: 'Permiso',
        date: p.requestDate,
        description: `Estado: ${p.status}`,
        tags: p.permissionTypes
    }));

const mapNeesToHistory = (nees: NEE[]): HistoryItem[] =>
    nees.map(n => ({
        id: n.id,
        type: 'NEE',
        date: n.evaluationDate,
        description: `Diagnóstico: ${n.diagnosis}`,
        tags: ['NEE']
    }));
    
const mapDropoutsToHistory = (dropouts: Dropout[]): HistoryItem[] =>
    dropouts.map(d => ({
        id: d.id,
        type: 'Deserción',
        date: d.dropoutDate,
        description: `Razón: ${d.reason}`,
        tags: ['Deserción']
    }));


export function StudentSummaryCard({ student }: { student: Student | null }) {
    const { incidents } = useIncidents();
    const { permissions } = usePermissions();
    const { nees } = useNee();
    const { dropouts } = useDesertion();
    
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    if (!student) {
        return null;
    }

    const studentIncidents = incidents.filter(i => i.studentId === student.id);
    const studentPermissions = permissions.filter(p => p.studentId === student.id);
    const studentNees = nees.filter(n => n.studentId === student.id);
    const studentDropouts = dropouts.filter(d => d.studentId === student.id);
    
    const combinedHistory = [
        ...mapIncidentsToHistory(studentIncidents),
        ...mapPermissionsToHistory(studentPermissions),
        ...mapNeesToHistory(studentNees),
        ...mapDropoutsToHistory(studentDropouts)
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const recentHistory = combinedHistory.slice(0, 3);
    
    const hasNee = studentNees.length > 0;

    return (
        <>
            <Card className="bg-muted/50">
                <CardHeader className="flex flex-row items-start justify-between pb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-base">{student.name}</CardTitle>
                            {hasNee && <Badge variant="secondary">NEE</Badge>}
                        </div>
                        <CardDescription>{student.grade} - Sección {student.section}</CardDescription>
                    </div>
                     <Button variant="outline" size="sm" onClick={() => setIsHistoryModalOpen(true)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Historial
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {studentIncidents.length > 0 && <Badge variant="default">Incidencias ({studentIncidents.length})</Badge>}
                        {studentPermissions.length > 0 && <Badge variant="default">Permisos ({studentPermissions.length})</Badge>}
                        {studentDropouts.length > 0 && <Badge variant="destructive">Deserción ({studentDropouts.length})</Badge>}
                    </div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-muted-foreground">
                        <History className="h-4 w-4" />
                        Historial Reciente
                    </h4>
                    {recentHistory.length > 0 ? (
                        <ul className="space-y-3 text-sm">
                            {recentHistory.map(item => (
                                <li key={item.id}>
                                    <div className="flex justify-between items-center">
                                        <p className="font-medium text-muted-foreground">{item.description}</p>
                                        <span className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {item.tags.map(tag => <Badge key={tag} variant="outline" className="font-normal rounded-md">{tag}</Badge>)}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground italic">No hay historial reciente para este estudiante.</p>
                    )}
                </CardContent>
            </Card>
            
            <StudentHistoryModal
                isOpen={isHistoryModalOpen}
                onOpenChange={setIsHistoryModalOpen}
                student={student}
                history={combinedHistory}
            />
        </>
    )
}
