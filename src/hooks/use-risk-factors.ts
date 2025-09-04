

"use client";

import { useMemo } from 'react';
import { useAppContext } from '@/context/app-context';
import type { RiskFactor } from '@/core/domain/types';
import { RiskFormValues } from '@/app/(app)/risk-assessment/components/risk-form';

export type RiskWithStudentInfo = RiskFactor & { grade?: string; section?: string };

export function useRiskFactors() {
  const { risks, students, addRiskFactor, editRiskFactor } = useAppContext();

  const risksWithStudentInfo: RiskWithStudentInfo[] = useMemo(() => {
    const studentMap = new Map(students.map(s => [s.id, s]));
    return risks.map(risk => {
      const student = studentMap.get(risk.studentId);
      return {
        ...risk,
        grade: student?.grade,
        section: student?.section,
      };
    });
  }, [risks, students]);
  
  return {
    risks,
    risksWithStudentInfo,
    addRiskFactor: (riskData: RiskFormValues) => addRiskFactor(riskData),
    editRiskFactor: (riskId: string, riskData: RiskFormValues) => editRiskFactor(riskId, riskData),
    isLoading: false,
  };
}

    