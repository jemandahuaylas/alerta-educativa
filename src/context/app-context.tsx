"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { 
  Student, Grade, Section, Assignment, Incident, Permission, RiskFactor, Dropout, NEE, UserProfile, UserProfileFormValues
} from '@/core/domain/types';
import * as authService from '@/core/services/auth-service';
import { supabase } from '@/lib/supabase/client';
import { 
    getAllData, AppData, addStudent as addStudentService,
    editStudent as editStudentService, deleteStudent as deleteStudentService,
    importStudents as importStudentsService, addBulkGrades as addBulkGradesService,
    editGradeName as editGradeNameService, deleteGrade as deleteGradeService,
    addBulkSections as addBulkSectionsService, deleteSection as deleteSectionService,
    editSectionName as editSectionNameService,
    addAssignments as addAssignmentsService, removeAssignment as removeAssignmentService,
    addIncident as addIncidentService, addIncidentType as addIncidentTypeService, deleteIncidentType as deleteIncidentTypeService,
    updateIncidentStatus as updateIncidentStatusService,
    addPermission as addPermissionService,
    updatePermissionStatus as updatePermissionStatusService,
    addPermissionType as addPermissionTypeService, deletePermissionType as deletePermissionTypeService,
    addNee as addNeeService,
    addNeeDiagnosisType as addNeeDiagnosisTypeService, deleteNeeDiagnosisType as deleteNeeDiagnosisTypeService,
    addDropout as addDropoutService, addDropoutReason as addDropoutReasonService, deleteDropoutReason as deleteDropoutReasonService,
    addRiskFactor as addRiskFactorService, editRiskFactor as editRiskFactorService,
    setSettingsService,
} from '@/core/services/data-service';
import type { StudentFormValues } from '@/app/(app)/students/components/student-form';
import type { AppSettings } from '@/hooks/use-settings';
import { RiskFormValues } from '@/app/(app)/risk-assessment/components/risk-form';

interface AppContextType extends Omit<AppData, 'grades' | 'assignments' | 'nees' | 'dropouts' | 'risks'> {
  grades: Grade[];
  assignments: Assignment[];
  nees: NEE[];
  dropouts: Dropout[];
  risks: RiskFactor[];
  isLoading: boolean;
  session: Session | null;
  currentUserProfile: UserProfile | null;
  setSession: (session: Session | null) => void;
  addStudent: (studentData: Omit<StudentFormValues, 'id'>, grade: Grade, section: Section) => Promise<void>;
  editStudent: (studentId: string, studentData: StudentFormValues) => Promise<void>;
  deleteStudent: (studentId: string) => Promise<void>;
  importStudents: (newStudents: Omit<Student, 'id' | 'name' | 'grade' | 'section' | 'gradeId' | 'sectionId' | 'first_name' | 'last_name'>[], grade: Grade, section: Section) => Promise<{ importedCount: number; skippedCount: number } | null>;
  addBulkGrades: (gradeNames: string[]) => Promise<void>;
  editGradeName: (gradeId: string, newName: string) => Promise<void>;
  deleteGrade: (gradeId: string) => Promise<void>;
  addBulkSections: (gradeId: string, sectionNames: string[]) => Promise<void>;
  deleteSection: (gradeId: string, sectionId: string) => Promise<void>;
  editSectionName: (sectionId: string, newName: string) => Promise<void>;
  addAssignments: (newAssignments: Omit<Assignment, 'id'>[]) => Promise<void>;
  removeAssignment: (assignmentId: string) => Promise<void>;
  addIncident: (incidentData: Omit<Incident, 'id' | 'studentName' | 'status' | 'followUpNotes' | 'registeredBy' | 'attendedBy' | 'attendedDate'>) => Promise<void>;
  updateIncidentStatus: (incidentId: string, status: 'Atendido', notes: string | undefined, attendedById: string) => Promise<void>;
  addIncidentType: (type: string) => void;
  deleteIncidentType: (typeToDelete: string) => void;
  addPermission: (permissionData: Omit<Permission, 'id' | 'studentName' | 'status'>) => Promise<void>;
  updatePermissionStatus: (permissionId: string, status: 'Aprobado' | 'Rechazado') => Promise<void>;
  addPermissionType: (type: string) => void;
  deletePermissionType: (typeToDelete: string) => void;
  addNee: (neeData: Omit<NEE, 'id' | 'studentName'>) => Promise<void>;
  addNeeDiagnosisType: (type: string) => void;
  deleteNeeDiagnosisType: (typeToDelete: string) => void;
  addDropout: (dropoutData: Omit<Dropout, 'id' | 'studentName'>) => Promise<void>;
  addDropoutReason: (reason: string) => void;
  deleteDropoutReason: (reasonToDelete: string) => void;
  addRiskFactor: (riskData: RiskFormValues) => Promise<void>;
  editRiskFactor: (riskId: string, riskData: RiskFormValues) => Promise<void>;
  setSettings: (value: AppSettings | ((val: AppSettings) => AppSettings)) => Promise<void>;
  addProfile: (profileData: UserProfileFormValues, isBulkImport?: boolean) => Promise<any>;
  bulkImportProfiles: (profilesData: Omit<UserProfile, 'id'>[]) => Promise<{imported: number; skipped: number; errors: string[]} | null>;
  refreshProfiles: () => Promise<void>;
  editProfile: (profileId: string, profileData: UserProfileFormValues) => Promise<void>;
  deleteProfile: (profileId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      const currentSession = await authService.getSession();
      setSession(currentSession);

      // Fetch data regardless of session for public pages, but restrict sensitive data if not logged in.
      const appData = await getAllData();
      setData(appData);
      
      setIsLoading(false);
    };
    
    initializeApp();

    // Agregar listener para cambios de estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        
        // Si el usuario se desconecta, limpiar datos
        if (event === 'SIGNED_OUT') {
          setData(null);
        }
        // Si el usuario se conecta, recargar datos
        else if (event === 'SIGNED_IN' && session) {
          const appData = await getAllData();
          setData(appData);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const currentUserProfile = useMemo(() => {
    if (!session || !data?.profiles) return null;
    return data.profiles.find(p => p.id === session.user.id) || null;
  }, [session, data?.profiles]);

  const updateState = (updater: (prevState: AppData) => AppData) => {
    setData(prevData => {
        if (!prevData) return null;
        return updater(prevData);
    });
  };
  
  const value: AppContextType = {
    ...data,
    grades: data?.grades ?? [],
    students: data?.students ?? [],
    assignments: data?.assignments ?? [],
    incidents: data?.incidents ?? [],
    incidentTypes: data?.incidentTypes ?? [],
    permissions: data?.permissions ?? [],
    permissionTypes: data?.permissionTypes ?? [],
    risks: data?.risks ?? [],
    dropouts: data?.dropouts ?? [],
    dropoutReasons: data?.dropoutReasons ?? [],
    nees: data?.nees ?? [],
    neeDiagnosisTypes: data?.neeDiagnosisTypes ?? [],
    profiles: data?.profiles ?? [],
    settings: data?.settings ?? { 
          isRegistrationEnabled: true, 
          isDriveConnected: false, 
          appName: "Alerta Educativa", 
          institutionName: "Mi Institución", 
          primaryColor: "#3B82F6", // Usar el mismo color por defecto que en CSS
          logoUrl: "",
          driveAccountEmail: undefined,
          driveStorageUsed: undefined,
          driveStorageLimit: undefined,
          driveLastSync: undefined,
          driveFolderId: undefined
        },
    isLoading,
    session,
    currentUserProfile,
    setSession,
    addStudent: async (studentData, grade, section) => {
        const newStudent = await addStudentService(studentData, grade, section);
        if (newStudent) {
            updateState(s => ({ ...s, students: [newStudent, ...s.students] }));
        }
    },
    editStudent: async (studentId, studentData) => {
        const updatedStudent = await editStudentService(studentId, studentData);
        if(updatedStudent) {
            updateState(s => ({
                ...s,
                students: s.students.map(stud => stud.id === studentId ? { ...stud, ...updatedStudent } : stud)
            }));
        }
    },
    deleteStudent: async (studentId) => {
        const success = await deleteStudentService(studentId);
        if(success) {
            updateState(s => ({ ...s, students: s.students.filter(stud => stud.id !== studentId) }));
        }
    },
    importStudents: async (newStudents, grade, section) => {
        const result = await importStudentsService(newStudents, grade, section);
        if(result && result.importedStudents) {
            updateState(s => ({ ...s, students: [...s.students, ...result.importedStudents] }));
            return { importedCount: result.importedStudents.length, skippedCount: result.skippedCount };
        }
        return null;
    },
    addBulkGrades: async (gradeNames) => {
        const newGrades = await addBulkGradesService(gradeNames);
        if (newGrades) {
            updateState(s => ({ ...s, grades: [...s.grades, ...newGrades].sort((a, b) => a.name.localeCompare(b.name)) }));
        }
    },
    editGradeName: async (gradeId, newName) => {
        const success = await editGradeNameService(gradeId, newName);
        if(success) {
            updateState(s => ({ ...s, grades: s.grades.map(g => (g.id === gradeId ? { ...g, name: newName } : g)) }));
        }
    },
    deleteGrade: async (gradeId) => {
        const success = await deleteGradeService(gradeId);
        if(success) {
            updateState(s => ({ ...s, grades: s.grades.filter(g => g.id !== gradeId) }));
        }
    },
    addBulkSections: async (gradeId, sectionNames) => {
        const newSections = await addBulkSectionsService(gradeId, sectionNames);
        if (newSections) {
            updateState(s => ({
                ...s,
                grades: s.grades.map(g => {
                    if (g.id === gradeId) {
                        return { ...g, sections: [...g.sections, ...newSections].sort((a, b) => a.name.localeCompare(b.name)) };
                    }
                    return g;
                }),
            }));
        }
    },
    deleteSection: async (gradeId, sectionId) => {
        const success = await deleteSectionService(sectionId);
        if(success) {
            updateState(s => ({
                ...s,
                grades: s.grades.map(g => {
                    if (g.id === gradeId) {
                        return { ...g, sections: g.sections.filter(sec => sec.id !== sectionId) };
                    }
                    return g;
                }),
            }));
        }
    },
    editSectionName: async (sectionId, newName) => {
        const success = await editSectionNameService(sectionId, newName);
        if(success) {
            updateState(s => ({
                ...s,
                grades: s.grades.map(g => ({
                    ...g,
                    sections: g.sections.map(sec => 
                        sec.id === sectionId ? { ...sec, name: newName } : sec
                    ),
                })),
            }));
        }
    },
    addAssignments: async (newAssignments) => {
        const added = await addAssignmentsService(newAssignments, data!.assignments);
        if (added) {
            updateState(s => ({ ...s, assignments: [...s.assignments, ...added] }));
        }
    },
    removeAssignment: async (assignmentId) => {
        const success = await removeAssignmentService(assignmentId);
        if (success) {
            updateState(s => ({ ...s, assignments: s.assignments.filter(a => a.id !== assignmentId) }));
        }
    },
    addIncident: async (incidentData) => {
        if (!currentUserProfile) throw new Error("User not authenticated");
        const newIncident = await addIncidentService(incidentData, currentUserProfile.id);
        if (newIncident) {
            const profileMap = new Map(data!.profiles.map(p => [p.id, p.name]));
            updateState(s => ({
                ...s, 
                incidents: [{ 
                    ...newIncident, 
                    studentName: s.students.find(st => st.id === newIncident.studentId)?.name || 'Desconocido',
                    registeredBy: profileMap.get(newIncident.registeredBy || ''),
                }, ...s.incidents] 
            }));
        }
    },
    updateIncidentStatus: async (incidentId, status, notes, attendedById) => {
        const updatedIncidentFields = await updateIncidentStatusService(incidentId, status, notes, attendedById);
        if (updatedIncidentFields) {
            const profileMap = new Map(data!.profiles.map(p => [p.id, p.name]));
            updateState(s => ({
                ...s,
                incidents: s.incidents.map(i => 
                    i.id === incidentId 
                    ? { ...i, ...updatedIncidentFields, attendedBy: profileMap.get(updatedIncidentFields.attendedById || '') } 
                    : i
                )
            }));
        }
    },
    addIncidentType: (type) => updateState(s => addIncidentTypeService(s, type)),
    deleteIncidentType: (typeToDelete) => updateState(s => deleteIncidentTypeService(s, typeToDelete)),
    addPermission: async (permissionData) => {
        const newPermission = await addPermissionService(permissionData);
        if (newPermission) {
             const student = data?.students.find(s => s.id === newPermission.studentId);
             if (student) {
                newPermission.studentName = student.name;
             }
            updateState(s => ({ ...s, permissions: [newPermission, ...s.permissions] }));
        }
    },
    updatePermissionStatus: async (permissionId, status) => {
        const updatedPermission = await updatePermissionStatusService(permissionId, status);
        if(updatedPermission) {
            updateState(s => ({
                ...s,
                permissions: s.permissions.map(p => p.id === permissionId ? { ...p, ...updatedPermission } : p)
            }));
        }
    },
    addPermissionType: (type) => updateState(s => addPermissionTypeService(s, type)),
    deletePermissionType: (typeToDelete) => updateState(s => deletePermissionTypeService(s, typeToDelete)),
    addNee: async (neeData) => {
        const newNee = await addNeeService(neeData);
        if (newNee) {
             const student = data?.students.find(s => s.id === newNee.studentId);
             if (student) {
                newNee.studentName = student.name;
             }
            updateState(s => ({ ...s, nees: [newNee, ...s.nees] }));
        }
    },
    addNeeDiagnosisType: (type) => updateState(s => addNeeDiagnosisTypeService(s, type)),
    deleteNeeDiagnosisType: (typeToDelete) => updateState(s => deleteNeeDiagnosisTypeService(s, typeToDelete)),
    addDropout: async (dropoutData) => {
        const newDropout = await addDropoutService(dropoutData);
        if (newDropout) {
            const student = data?.students.find(s => s.id === newDropout.studentId);
            if (student) {
                newDropout.studentName = student.name;
            }
            updateState(s => ({ ...s, dropouts: [newDropout, ...s.dropouts] }));
        }
    },
    addDropoutReason: (reason) => updateState(s => addDropoutReasonService(s, reason)),
    deleteDropoutReason: (reasonToDelete) => updateState(s => deleteDropoutReasonService(s, reasonToDelete)),
    addRiskFactor: async (riskData) => {
        const newRiskFactor = await addRiskFactorService(riskData);
        if (newRiskFactor) {
            const student = data?.students.find(s => s.id === newRiskFactor.studentId);
            if(student) {
                newRiskFactor.studentName = student.name;
            }
            updateState(s => ({ ...s, risks: [newRiskFactor, ...s.risks] }));
        }
    },
    editRiskFactor: async (riskId, riskData) => {
        const updatedRiskFactor = await editRiskFactorService(riskId, riskData);
        if (updatedRiskFactor) {
            updateState(s => ({
                ...s,
                risks: s.risks.map(r => r.id === riskId ? { ...r, ...updatedRiskFactor } : r)
            }));
        }
    },
    setSettings: async (value) => {
        const newSettings = value instanceof Function ? value(data!.settings) : value;
        const updatedSettings = await setSettingsService(newSettings);
        if (updatedSettings) {
            updateState(s => ({ ...s, settings: { ...s.settings, ...updatedSettings } }));
        }
    },
    addProfile: async (profileData, isBulkImport = false) => {
        console.log(`👤 addProfile called for: ${profileData.email}, isBulkImport: ${isBulkImport}`);
        
        if (isBulkImport) {
            console.log(`📦 Bulk import mode - calling signUpAlternative`);
            const result = await authService.signUpAlternative(profileData);
            console.log(`✅ signUpAlternative completed for: ${profileData.email}`, result);
            // For bulk imports, don't reload profiles immediately to avoid performance issues
            // The calling function should handle reloading profiles after all imports are done
            return result;
        } else {
            console.log(`👤 Single user mode - calling signUp`);
            await authService.signUp(profileData);
            const profiles = await authService.getProfiles();
            updateState(s => ({ ...s, profiles }));
        }
    },
    bulkImportProfiles: async (profilesData) => {
        console.log(`📦 bulkImportProfiles called for ${profilesData.length} profiles`);
        const result = await authService.bulkImportUsers(profilesData);
        console.log(`✅ bulkImportProfiles completed:`, result);
        return result;
    },
    refreshProfiles: async () => {
        const profiles = await authService.getProfiles();
        updateState(s => ({ ...s, profiles }));
    },
    editProfile: async (profileId, profileData) => {
        console.log('👤 editProfile called with:', { profileId, profileData });
        const updatedProfile = await authService.editProfile(profileId, profileData);
        console.log('✅ editProfile result:', updatedProfile);
        if (updatedProfile) {
            updateState(s => ({ ...s, profiles: s.profiles.map(p => p.id === profileId ? updatedProfile : p) }));
            console.log('🔄 Profile updated in state');
        } else {
            console.error('❌ Failed to update profile');
        }
    },
    deleteProfile: async (profileId) => {
        const success = await authService.deleteProfile(profileId);
        if (success) {
            updateState(s => ({ ...s, profiles: s.profiles.filter(p => p.id !== profileId) }));
        }
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

export { AppContext };
