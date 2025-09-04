
"use client";

import { useMemo } from 'react';
import { useAppContext } from '@/context/app-context';
import type { UserProfile, Assignment } from '@/core/domain/types';

export function usePersonnel() {
  const {
    profiles,
    assignments,
    addAssignments,
    removeAssignment,
  } = useAppContext();

  const personnel = useMemo(() => profiles.filter(p => p.role === 'Docente' || p.role === 'Auxiliar'), [profiles]);
  
  return {
    personnel,
    assignments,
    addAssignments: (newAssignments: Omit<Assignment, 'id'>[]) => addAssignments(newAssignments),
    removeAssignment: (assignmentId: string) => removeAssignment(assignmentId),
    isLoading: false,
  };
}
