
"use client";

import { useMemo } from 'react';
import { useAppContext } from '@/context/app-context';
import type { NEE } from '@/core/domain/types';

export type NeeWithStudentInfo = NEE & { grade?: string; section?: string };

export function useNee() {
  const { nees, students, addNee, neeDiagnosisTypes, addNeeDiagnosisType, deleteNeeDiagnosisType } = useAppContext();

  const neesWithStudentInfo: NeeWithStudentInfo[] = useMemo(() => {
    const studentMap = new Map(students.map(s => [s.id, s]));
    return nees.map(nee => {
      const student = studentMap.get(nee.studentId);
      return {
        ...nee,
        grade: student?.grade,
        section: student?.section,
      };
    }).sort((a, b) => new Date(b.evaluationDate).getTime() - new Date(a.evaluationDate).getTime());
  }, [nees, students]);

  return {
    nees,
    neeDiagnosisTypes,
    neesWithStudentInfo,
    addNee: (neeData: Omit<NEE, 'id' | 'studentName'>) => addNee(neeData),
    addNeeDiagnosisType,
    deleteNeeDiagnosisType,
  };
}
