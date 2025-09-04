

"use client";

import { useMemo } from 'react';
import { useAppContext } from '@/context/app-context';
import type { Incident } from '@/core/domain/types';

export type IncidentWithStudentInfo = Incident & { grade?: string; section?: string, sectionId?: string };

export function useIncidents() {
  const { incidents, students, addIncident, incidentTypes, addIncidentType, deleteIncidentType, updateIncidentStatus } = useAppContext();

  const incidentsWithStudentInfo: IncidentWithStudentInfo[] = useMemo(() => {
    const studentMap = new Map(students.map(s => [s.id, s]));
    return incidents.map(incident => {
      const student = studentMap.get(incident.studentId);
      return {
        ...incident,
        grade: student?.grade,
        section: student?.section,
        sectionId: student?.sectionId,
      };
    })
  }, [incidents, students]);
  
  return {
    incidents,
    incidentsWithStudentInfo,
    addIncident,
    updateIncidentStatus,
    incidentTypes,
    addIncidentType,
    deleteIncidentType,
    isLoading: false, // Agregado para compatibilidad
  };
}
