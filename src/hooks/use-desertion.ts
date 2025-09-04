
"use client";

import { useMemo } from 'react';
import { useAppContext } from '@/context/app-context';
import type { Dropout } from '@/core/domain/types';

export type DropoutWithStudentInfo = Dropout & { grade?: string; section?: string };

export function useDesertion() {
  const { dropouts, students, addDropout, dropoutReasons, addDropoutReason, deleteDropoutReason } = useAppContext();

  const dropoutsWithStudentInfo: DropoutWithStudentInfo[] = useMemo(() => {
    const studentMap = new Map(students.map(s => [s.id, s]));
    return dropouts.map(dropout => {
      const student = studentMap.get(dropout.studentId);
      return {
        ...dropout,
        grade: student?.grade,
        section: student?.section,
      };
    }).sort((a, b) => new Date(b.dropoutDate).getTime() - new Date(a.dropoutDate).getTime());
  }, [dropouts, students]);

  return {
    dropouts,
    dropoutReasons,
    dropoutsWithStudentInfo,
    addDropout: (dropoutData: Omit<Dropout, 'id' | 'studentName'>) => addDropout(dropoutData),
    addDropoutReason,
    deleteDropoutReason,
    isLoading: false,
  };
}
