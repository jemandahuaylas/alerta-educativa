
"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PlusCircle, Download } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { useIncidents, IncidentWithStudentInfo } from '@/hooks/use-incidents';
import { useStudents } from '@/hooks/use-students';
import { IncidentFilterSheet } from './incident-filter-sheet';
import { IncidentHistoryModal } from './incident-history-modal';
import { DownloadReportModal } from '@/components/organisms/download-report-modal';
import ResourceToolbar from '@/components/organisms/resource-toolbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ResourceListView from '../resource-list-view';

type StudentSummary = {
    id: string;
    studentName: string;
    grade?: string;
    section?: string;
    incidentCount: number;
};

const GridViewCard = ({ item: summary, onClick }: { item: StudentSummary, onClick: (name: string) => void}) => (
    <Card 
        className="shadow-sm hover:shadow-lg hover:border-accent transition-all rounded-xl group cursor-pointer border-2 border-transparent"
        onClick={() => onClick(summary.studentName)}
    >
        <CardContent className="p-4 flex flex-col items-center text-center gap-3">
             <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold text-lg">
                {summary.studentName.charAt(0)}
             </div>
            <div className="flex flex-col items-center">
                <p className="font-semibold text-card-foreground">{summary.studentName}</p>
                {summary.grade && summary.section && (
                    <p className="text-xs text-muted-foreground">
                    {summary.grade} - Sección {summary.section}
                    </p>
                )}
            </div>
            {summary.incidentCount > 0 && (
                <Badge variant="default" className="mt-2">
                {summary.incidentCount} {summary.incidentCount === 1 ? 'incidencia' : 'incidencias'}
                </Badge>
            )}
        </CardContent>
    </Card>
);

const ListViewCard = ({ item: summary, onClick }: { item: StudentSummary, onClick: (name: string) => void}) => (
    <Card 
        className="shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer"
        onClick={() => onClick(summary.studentName)}
    >
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold">
                    {summary.studentName.charAt(0)}
                </div>
                <div>
                    <p className="font-semibold">{summary.studentName}</p>
                    <p className="text-xs text-muted-foreground">{summary.grade} - Sección {summary.section}</p>
                </div>
            </div>
            
            <Badge variant="default" className="ml-4">
                {summary.incidentCount || 0} {summary.incidentCount === 1 ? 'incidencia' : 'incidencias'}
            </Badge>
        </div>
    </Card>
);


export default function IncidentList() {
  const { incidentsWithStudentInfo } = useIncidents();
  const { students } = useStudents();

  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [selectedIncidentTypes, setSelectedIncidentTypes] = useState<string[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedStudentName, setSelectedStudentName] = useState<string | null>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const incidentTypesWithCounts = useMemo(() => {
    const typeCounts: { [key: string]: number } = {};
    incidentsWithStudentInfo.forEach(incident => {
      if (Array.isArray(incident.incidentTypes)) {
        incident.incidentTypes.forEach(type => {
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
      }
    });
    return Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => a.type.localeCompare(b.type));
  }, [incidentsWithStudentInfo]);


  const filteredIncidents = useMemo(() => {
    return incidentsWithStudentInfo.filter(incident => {
      const searchMatch = incident.studentName.toLowerCase().includes(searchQuery.toLowerCase());
      const typeMatch = selectedIncidentTypes.length === 0 || 
                        (Array.isArray(incident.incidentTypes) && selectedIncidentTypes.every(type => incident.incidentTypes.includes(type)));
      return searchMatch && typeMatch;
    });
  }, [incidentsWithStudentInfo, searchQuery, selectedIncidentTypes]);
  
  const handleApplyFilters = (types: string[]) => {
    setSelectedIncidentTypes(types);
    setIsFilterSheetOpen(false);
  }

  const handleCardClick = (studentName: string) => {
    setSelectedStudentName(studentName);
    setIsHistoryModalOpen(true);
  };

  const selectedStudent = useMemo(() => {
    if (!selectedStudentName) return null;
    return students.find(s => s.name === selectedStudentName);
  }, [selectedStudentName, students]);

  const studentIncidents = useMemo(() => {
    if (!selectedStudentName) return [];
    return incidentsWithStudentInfo.filter(i => i.studentName === selectedStudentName)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedStudentName, incidentsWithStudentInfo]);

  const studentSummaries: StudentSummary[] = useMemo(() => {
    const incidentsByStudent = filteredIncidents.reduce((acc, incident) => {
        if (!acc[incident.studentId]) {
            acc[incident.studentId] = [];
        }
        acc[incident.studentId].push(incident);
        return acc;
    }, {} as Record<string, IncidentWithStudentInfo[]>);

    return Object.values(incidentsByStudent).map(studentIncidents => {
        const student = studentIncidents[0];
        return {
            id: student.studentId,
            studentName: student.studentName,
            grade: student.grade,
            section: student.section,
            incidentCount: studentIncidents.length
        };
    }).sort((a,b) => b.incidentCount - a.incidentCount);
  }, [filteredIncidents]);
  
  return (
    <>
      <PageHeader
        title="Incidentes"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsDownloadModalOpen(true)}>
              <Download className="mr-2 h-4 w-4" />
              Descargar
            </Button>
            <Link href="/incidents/nuevo">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Registrar Incidente
              </Button>
            </Link>
          </div>
        }
      />
      
      <ResourceToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        view={view}
        onViewChange={setView}
        onFilterClick={() => setIsFilterSheetOpen(true)}
        filterBadgeCount={selectedIncidentTypes.length}
      />

      <ResourceListView
        items={studentSummaries}
        view={view}
        isLoading={!isClient}
        renderGridItem={(summary) => <GridViewCard item={summary} onClick={handleCardClick} />}
        renderListItem={(summary) => <ListViewCard item={summary} onClick={handleCardClick} />}
        noResultsMessage="No hay incidentes que coincidan con su búsqueda o filtros."
      />

      <IncidentFilterSheet
        isOpen={isFilterSheetOpen}
        onOpenChange={setIsFilterSheetOpen}
        incidentTypesWithCounts={incidentTypesWithCounts}
        selectedTypes={selectedIncidentTypes}
        onApply={handleApplyFilters}
      />

      {selectedStudent && (
        <IncidentHistoryModal
          isOpen={isHistoryModalOpen}
          onOpenChange={setIsHistoryModalOpen}
          student={selectedStudent}
          incidents={studentIncidents}
        />
      )}

      <DownloadReportModal
        isOpen={isDownloadModalOpen}
        onOpenChange={setIsDownloadModalOpen}
      />
    </>
  );
}
