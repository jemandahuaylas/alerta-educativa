"use client";

import { useMemo } from 'react';
import { useAppContext } from '@/context/app-context';
import type { Permission } from '@/core/domain/types';

export type PermissionWithStudentInfo = Permission & { grade?: string; section?: string };

export function usePermissions() {
  const { permissions, students, addPermission, permissionTypes, addPermissionType, deletePermissionType, updatePermissionStatus } = useAppContext();

  const permissionsWithStudentInfo: PermissionWithStudentInfo[] = useMemo(() => {
    const studentMap = new Map(students.map(s => [s.id, s]));
    return permissions.map(permission => {
      const student = studentMap.get(permission.studentId);
      return {
        ...permission,
        grade: student?.grade,
        section: student?.section,
      };
    }).sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
  }, [permissions, students]);

  return {
    permissions,
    permissionTypes,
    permissionsWithStudentInfo,
    addPermission,
    updatePermissionStatus,
    addPermissionType,
    deletePermissionType,
  };
}
