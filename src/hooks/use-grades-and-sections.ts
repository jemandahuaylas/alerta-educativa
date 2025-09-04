"use client";

import { useAppContext } from '@/context/app-context';

export function useGradesAndSections() {
  const { 
    grades, 
    addBulkGrades, 
    editGradeName, 
    deleteGrade, 
    addBulkSections, 
    deleteSection,
    editSectionName,
  } = useAppContext();

  return {
    grades,
    addBulkGrades,
    editGradeName,
    deleteGrade,
    addBulkSections,
    deleteSection,
    editSectionName,
    isLoading: false,
  };
}
