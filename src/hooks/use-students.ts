
"use client";

import { useAppContext } from '@/context/app-context';

export function useStudents() {
  const { 
    students, 
    addStudent, 
    editStudent, 
    deleteStudent, 
    importStudents 
  } = useAppContext();

  return {
    students,
    addStudent,
    editStudent,
    deleteStudent,
    importStudents,
    isLoading: false, // Agregado para compatibilidad
  };
}
