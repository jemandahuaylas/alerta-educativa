"use client";

import { supabase } from '@/lib/supabase/client';
import type { 
  Student, Grade, Section, Assignment, Incident, Permission, RiskFactor, Dropout, NEE, UserProfile
} from '@/core/domain/types';
import type { AppSettings } from '@/hooks/use-settings';
import type { StudentFormValues } from '@/app/(app)/students/components/student-form';
import {
  initialPermissionTypes,
  initialDropoutReasons, initialNeeDiagnosisTypes, initialIncidentTypes,
} from '@/lib/placeholder-data';
import { RiskFormValues } from '@/app/(app)/risk-assessment/components/risk-form';
import { getProfiles } from './auth-service';

export interface AppData {
  students: Student[];
  grades: Grade[];
  assignments: Assignment[];
  incidents: Incident[];
  incidentTypes: string[];
  permissions: Permission[];
  permissionTypes: string[];
  risks: RiskFactor[];
  dropouts: Dropout[];
  dropoutReasons: string[];
  nees: NEE[];
  neeDiagnosisTypes: string[];
  profiles: UserProfile[];
  settings: AppSettings;
}

// --- Data Access Layer ---

export async function getAllData(): Promise<AppData> {
  const profiles = await getProfiles(); // Fetch profiles first
  const profileMap = new Map(profiles.map(p => [p.id, p.name]));

  // Fetch in parallel
  const [
    gradesRes, studentsRes, assignmentsRes, incidentsRes, 
    permissionsRes, neesRes, dropoutsRes, risksRes, settingsRes
  ] = await Promise.all([
    supabase.from('grades').select(`id, name, sections (id, name)`).order('name', { ascending: true }),
    supabase.from('students').select(`id, first_name, last_name, dni, grade_id, section_id`),
    supabase.from('assignments').select(`id, teacher_id, grade_id, section_id`),
    supabase.from('incidents').select(`id, student_id, date, incident_types, status, follow_up_notes, registered_by, attended_by, attended_date`).order('date', { ascending: false }),
    supabase.from('permissions').select(`id, student_id, request_date, permission_types, status`).order('request_date', { ascending: false }),
    supabase.from('nee_records').select(`id, student_id, diagnosis, evaluation_date, support_plan`).order('evaluation_date', { ascending: false }),
    supabase.from('dropouts').select(`id, student_id, dropout_date, reason, notes`).order('dropout_date', { ascending: false }),
    supabase.from('risk_factors').select(`id, student_id, category, level, notes`).order('created_at', { ascending: false }),
    supabase.from('settings').select('allow_registration, app_name, institution_name, logo_url, primary_color').single(),
  ]);

  const { data: gradesData, error: gradesError } = gradesRes;
  if (gradesError) console.error('Error fetching grades:', gradesError);
  const grades: Grade[] = (gradesData || []).map((g: any) => ({
    id: g.id,
    name: g.name,
    sections: g.sections.sort((a: Section, b: Section) => a.name.localeCompare(b.name))
  }));

  const gradeMap = new Map(grades.map(g => [g.id, g]));
  const sectionMap = new Map(grades.flatMap(g => g.sections).map(s => [s.id, s]));

  const { data: studentsData, error: studentsError } = studentsRes;
  if (studentsError) console.error('Error fetching students:', studentsError);
  const students: Student[] = (studentsData || []).map((s: any) => {
    const grade = gradeMap.get(s.grade_id);
    const section = sectionMap.get(s.section_id);
    return {
      id: s.id,
      first_name: s.first_name, // keep for search
      last_name: s.last_name,   // keep for search
      firstName: s.first_name,
      lastName: s.last_name,
      name: `${s.first_name} ${s.last_name}`,
      dni: s.dni,
      grade: grade?.name ?? 'N/A',
      section: section?.name ?? 'N/A',
      gradeId: s.grade_id,
      sectionId: s.section_id,
    };
  });
  const studentIdMap = new Map(students.map(s => [s.id, s]));
  
  const { data: assignmentsData, error: assignmentsError } = assignmentsRes;
  if (assignmentsError) console.error('Error fetching assignments:', assignmentsError);
  const assignments: Assignment[] = (assignmentsData || []).map((a: any) => ({
      id: a.id,
      teacher_id: a.teacher_id,
      grade_id: a.grade_id,
      section_id: a.section_id,
  }));

  const { data: incidentsData, error: incidentsError } = incidentsRes;
  if (incidentsError) console.error('Error fetching incidents:', incidentsError);
  const incidents: Incident[] = (incidentsData || []).map((i: any) => ({
      id: i.id,
      studentId: i.student_id,
      studentName: studentIdMap.get(i.student_id)?.name ?? 'Estudiante Desconocido',
      date: i.date,
      incidentTypes: i.incident_types,
      status: i.status,
      followUpNotes: i.follow_up_notes,
      registeredBy: profileMap.get(i.registered_by),
      attendedBy: profileMap.get(i.attended_by),
      attendedDate: i.attended_date,
      attendedById: i.attended_by,
  }));
  
  const { data: permissionsData, error: permissionsError } = permissionsRes;
  if (permissionsError) console.error('Error fetching permissions:', permissionsError);
  const permissions: Permission[] = (permissionsData || []).map((p: any) => ({
      id: p.id,
      studentId: p.student_id,
      studentName: studentIdMap.get(p.student_id)?.name ?? 'Estudiante Desconocido',
      requestDate: p.request_date,
      permissionTypes: p.permission_types,
      status: p.status,
  }));

  const { data: neesData, error: neesError } = neesRes;
  if (neesError) console.error('Error fetching NEE records:', neesError);
  const nees: NEE[] = (neesData || []).map((n: any) => ({
      id: n.id,
      studentId: n.student_id,
      studentName: studentIdMap.get(n.student_id)?.name ?? 'Estudiante Desconocido',
      diagnosis: n.diagnosis,
      evaluationDate: n.evaluation_date,
      supportPlan: n.support_plan,
  }));

  const { data: dropoutsData, error: dropoutsError } = dropoutsRes;
  if (dropoutsError) console.error('Error fetching dropouts:', dropoutsError);
  const dropouts: Dropout[] = (dropoutsData || []).map((d: any) => ({
      id: d.id,
      studentId: d.student_id,
      studentName: studentIdMap.get(d.student_id)?.name ?? 'Estudiante Desconocido',
      dropoutDate: d.dropout_date,
      reason: d.reason,
      notes: d.notes,
  }));

  const { data: risksData, error: risksError } = risksRes;
  if (risksError) console.error('Error fetching risk factors:', risksError);
  const risks: RiskFactor[] = (risksData || []).map((r: any) => ({
      id: r.id,
      studentId: r.student_id,
      studentName: studentIdMap.get(r.student_id)?.name ?? 'Estudiante Desconocido',
      category: r.category,
      level: r.level,
      notes: r.notes,
  }));

  const { data: settingsData, error: settingsError } = settingsRes;
  if (settingsError) console.error('Error fetching settings:', settingsError);

  const settings: AppSettings = {
    isRegistrationEnabled: settingsData?.allow_registration ?? false,
    appName: settingsData?.app_name || "Alerta Educativa",
    institutionName: settingsData?.institution_name || "Mi Institución",
    logoUrl: settingsData?.logo_url || "",
    primaryColor: settingsData?.primary_color || "#1F618D",
    isDriveConnected: false, // This remains client-side for now
  };

  return { 
    grades, students, assignments, incidents, permissions, nees, dropouts, risks, profiles, settings,
    incidentTypes: initialIncidentTypes,
    permissionTypes: initialPermissionTypes,
    dropoutReasons: initialDropoutReasons,
    neeDiagnosisTypes: initialNeeDiagnosisTypes
  };
}


// --- Service Functions (Mutations) ---

// Students
export const addStudent = async (studentData: Omit<StudentFormValues, 'id'>, grade: Grade, section: Section): Promise<Student | null> => {
    const { data, error } = await supabase
        .from('students')
        .insert({
            first_name: studentData.firstName,
            last_name: studentData.lastName,
            dni: studentData.dni,
            grade_id: grade.id,
            section_id: section.id,
        })
        .select()
        .single();
    
    if (error) {
        console.error('Error adding student:', error);
        return null;
    }
    
    return {
        id: data.id,
        first_name: data.first_name,
        last_name: data.last_name,
        firstName: data.first_name,
        lastName: data.last_name,
        name: `${data.first_name} ${data.last_name}`,
        dni: data.dni,
        grade: grade.name,
        section: section.name,
        gradeId: data.grade_id,
        sectionId: data.section_id,
    };
};

export const editStudent = async (studentId: string, studentData: StudentFormValues): Promise<Partial<Student> | null> => {
    const { data, error } = await supabase
        .from('students')
        .update({
            first_name: studentData.firstName,
            last_name: studentData.lastName,
            dni: studentData.dni,
        })
        .eq('id', studentId)
        .select()
        .single();
        
    if (error) {
        console.error('Error editing student:', error);
        return null;
    }

    return {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        name: `${data.first_name} ${data.last_name}`,
        dni: data.dni,
    };
};

export const deleteStudent = async (studentId: string): Promise<boolean> => {
    const { error } = await supabase.from('students').delete().match({ id: studentId });
    if (error) {
        console.error('Error deleting student:', error);
        return false;
    }
    return true;
};

export const importStudents = async (
  newStudents: Omit<Student, 'id' | 'name' | 'grade' | 'section' | 'gradeId' | 'sectionId' | 'first_name' | 'last_name'>[], 
  grade: Grade, 
  section: Section
): Promise<{ importedStudents: Student[], skippedCount: number } | null> => {
    const { data: existingStudents, error: fetchError } = await supabase
        .from('students')
        .select('dni');

    if (fetchError) {
        console.error('Error fetching existing students:', fetchError);
        return null;
    }

    const existingDnis = new Set(existingStudents.map(s => s.dni));
    
    const studentsToInsert = newStudents
        .filter(s => !existingDnis.has(s.dni))
        .map(s => ({
            first_name: s.firstName,
            last_name: s.lastName,
            dni: s.dni,
            grade_id: grade.id,
            section_id: section.id,
        }));
        
    const skippedCount = newStudents.length - studentsToInsert.length;

    if (studentsToInsert.length === 0) {
        return { importedStudents: [], skippedCount };
    }

    const { data, error } = await supabase
        .from('students')
        .insert(studentsToInsert)
        .select();
        
    if (error) {
        console.error('Error importing students:', error);
        return null;
    }

    const importedStudents = data.map(s => ({
        id: s.id,
        first_name: s.first_name,
        last_name: s.last_name,
        firstName: s.first_name,
        lastName: s.last_name,
        name: `${s.first_name} ${s.last_name}`,
        dni: s.dni,
        grade: grade.name,
        section: section.name,
        gradeId: s.grade_id,
        sectionId: s.section_id,
    }));
    
    return { importedStudents, skippedCount };
};

// Grades and Sections
export const addBulkGrades = async (gradeNames: string[]): Promise<Grade[] | null> => {
    const newGradesToInsert = gradeNames.map(name => ({ name }));
    
    const { data, error } = await supabase
        .from('grades')
        .insert(newGradesToInsert)
        .select();

    if (error) {
        console.error('Supabase error in addBulkGrades:', error);
        return null;
    }
    
    return data.map(g => ({...g, sections: []}));
};

export const editGradeName = async (gradeId: string, newName: string): Promise<boolean> => {
    const { error } = await supabase.from('grades').update({ name: newName }).match({ id: gradeId });
    if (error) {
        console.error('Error editing grade:', error);
        return false;
    }
    return true;
};

export const deleteGrade = async (gradeId: string): Promise<boolean> => {
    const { error } = await supabase.from('grades').delete().match({ id: gradeId });
    if (error) {
        console.error('Error deleting grade:', error);
        return false;
    }
    return true;
};

export const addBulkSections = async (gradeId: string, sectionNames: string[]): Promise<Section[] | null> => {
    const newSectionsToInsert = sectionNames.map(name => ({ name, grade_id: gradeId }));

    const { data, error } = await supabase
        .from('sections')
        .insert(newSectionsToInsert)
        .select();
    
    if (error) {
        console.error('Error adding sections:', error);
        return null;
    }
    return data;
};

export const deleteSection = async (sectionId: string): Promise<boolean> => {
     const { error } = await supabase.from('sections').delete().match({ id: sectionId });
    if (error) {
        console.error('Error deleting section:', error);
        return false;
    }
    return true;
};

export const editSectionName = async (sectionId: string, newName: string): Promise<boolean> => {
    const { error } = await supabase.from('sections').update({ name: newName }).match({ id: sectionId });
    if (error) {
        console.error('Error editing section:', error);
        return false;
    }
    return true;
};


// Assignments
export const addAssignments = async (newAssignments: Omit<Assignment, 'id'>[], existingAssignments: Assignment[]): Promise<Assignment[] | null> => {
    const assignmentsToAdd = newAssignments
        .filter(newA => 
            !existingAssignments.some(existingA => 
                existingA.teacher_id === newA.teacher_id &&
                existingA.grade_id === newA.grade_id &&
                existingA.section_id === newA.section_id
            )
        )
        .map(a => ({ teacher_id: a.teacher_id, grade_id: a.grade_id, section_id: a.section_id }));

    if (assignmentsToAdd.length === 0) return [];

    const { data, error } = await supabase.from('assignments').insert(assignmentsToAdd).select();
    if (error) {
        console.error('Error adding assignments:', error);
        return null;
    }
    return data.map(a => ({ id: a.id, teacher_id: a.teacher_id, grade_id: a.grade_id, section_id: a.section_id }));
};

export const removeAssignment = async (assignmentId: string): Promise<boolean> => {
    const { error } = await supabase.from('assignments').delete().eq('id', assignmentId);
    if (error) {
        console.error('Error removing assignment:', error);
        return false;
    }
    return true;
};


// Incidents
export const addIncident = async (incidentData: Omit<Incident, 'id' | 'studentName' | 'status' | 'followUpNotes' | 'registeredBy' | 'attendedBy' | 'attendedDate'>, currentUserId: string): Promise<Incident | null> => {
    const { data, error } = await supabase
        .from('incidents')
        .insert({
            student_id: incidentData.studentId,
            date: incidentData.date,
            incident_types: incidentData.incidentTypes,
            registered_by: currentUserId,
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding incident:', error);
        return null;
    }

    return {
        id: data.id,
        studentId: data.student_id,
        studentName: '', // Will be hydrated in the context
        date: data.date,
        incidentTypes: data.incident_types,
        status: data.status,
        followUpNotes: data.follow_up_notes,
        registeredBy: data.registered_by,
    };
};

export const updateIncidentStatus = async (incidentId: string, status: 'Atendido', notes: string | undefined, attendedById: string): Promise<Partial<Incident> | null> => {
    const { data, error } = await supabase
        .from('incidents')
        .update({ 
            status: status, 
            follow_up_notes: notes,
            attended_by: attendedById,
            attended_date: new Date().toISOString(),
        })
        .eq('id', incidentId)
        .select('status, follow_up_notes, attended_by, attended_date')
        .single();

    if (error) {
        console.error('Error updating incident status:', error);
        return null;
    }

    return { 
        status: data.status, 
        followUpNotes: data.follow_up_notes,
        attendedById: data.attended_by,
        attendedDate: data.attended_date,
    };
};


export const addIncidentType = (state: AppData, type: string): AppData => {
    const trimmedType = type.trim();
    if (trimmedType && !state.incidentTypes.includes(trimmedType)) {
      return { ...state, incidentTypes: [...state.incidentTypes, trimmedType].sort() };
    }
    return state;
};

export const deleteIncidentType = (state: AppData, typeToDelete: string): AppData => ({
    ...state,
    incidentTypes: state.incidentTypes.filter(type => type !== typeToDelete),
});

// Permissions
export const addPermission = async (permissionData: Omit<Permission, 'id' | 'studentName' | 'status'>): Promise<Permission | null> => {
    const { data, error } = await supabase
        .from('permissions')
        .insert({
            student_id: permissionData.studentId,
            request_date: permissionData.requestDate,
            permission_types: permissionData.permissionTypes,
        })
        .select()
        .single();
    
    if (error) {
        console.error('Error adding permission:', error);
        return null;
    }
    
    return {
        id: data.id,
        studentId: data.student_id,
        studentName: '', // Will be hydrated in the context
        requestDate: data.request_date,
        permissionTypes: data.permission_types,
        status: data.status,
    };
};

export const updatePermissionStatus = async (permissionId: string, status: 'Aprobado' | 'Rechazado'): Promise<Partial<Permission> | null> => {
    const { data, error } = await supabase
        .from('permissions')
        .update({ status: status })
        .eq('id', permissionId)
        .select('status')
        .single();
    
    if (error) {
        console.error('Error updating permission status:', error);
        return null;
    }
    return { status: data.status };
};

export const addPermissionType = (state: AppData, type: string): AppData => {
    const trimmedType = type.trim();
    if (trimmedType && !state.permissionTypes.includes(trimmedType)) {
      return { ...state, permissionTypes: [...state.permissionTypes, trimmedType].sort() };
    }
    return state;
};

export const deletePermissionType = (state: AppData, typeToDelete: string): AppData => ({
    ...state,
    permissionTypes: state.permissionTypes.filter(type => type !== typeToDelete),
});

// NEE
export const addNee = async (neeData: Omit<NEE, 'id' | 'studentName'>): Promise<NEE | null> => {
    const { data, error } = await supabase
        .from('nee_records')
        .insert({
            student_id: neeData.studentId,
            diagnosis: neeData.diagnosis,
            evaluation_date: neeData.evaluationDate,
            support_plan: neeData.supportPlan,
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding NEE record:', error);
        return null;
    }

    return {
        id: data.id,
        studentId: data.student_id,
        studentName: '', // Will be hydrated in context
        diagnosis: data.diagnosis,
        evaluationDate: data.evaluation_date,
        supportPlan: data.support_plan,
    };
};


export const addNeeDiagnosisType = (state: AppData, type: string): AppData => {
    const trimmedType = type.trim();
    if (trimmedType && !state.neeDiagnosisTypes.includes(trimmedType)) {
        return { ...state, neeDiagnosisTypes: [...state.neeDiagnosisTypes, trimmedType].sort() };
    }
    return state;
};

export const deleteNeeDiagnosisType = (state: AppData, typeToDelete: string): AppData => ({
    ...state,
    neeDiagnosisTypes: state.neeDiagnosisTypes.filter(type => type !== typeToDelete),
});

// Dropout
export const addDropout = async (dropoutData: Omit<Dropout, 'id' | 'studentName'>): Promise<Dropout | null> => {
    const { data, error } = await supabase
        .from('dropouts')
        .insert({
            student_id: dropoutData.studentId,
            dropout_date: dropoutData.dropoutDate,
            reason: dropoutData.reason,
            notes: dropoutData.notes,
        })
        .select()
        .single();
        
    if (error) {
        console.error('Error adding dropout record:', error);
        return null;
    }
    
    return {
        id: data.id,
        studentId: data.student_id,
        studentName: '', // Will be hydrated in context
        dropoutDate: data.dropout_date,
        reason: data.reason,
        notes: data.notes,
    };
};

export const addDropoutReason = (state: AppData, reason: string): AppData => {
    const trimmedReason = reason.trim();
    if (trimmedReason && !state.dropoutReasons.includes(trimmedReason)) {
      return { ...state, dropoutReasons: [...state.dropoutReasons, trimmedReason].sort() };
    }
    return state;
};

export const deleteDropoutReason = (state: AppData, reasonToDelete: string): AppData => ({
    ...state,
    dropoutReasons: state.dropoutReasons.filter(reason => reason !== reasonToDelete),
});

// Risk Factors
export const addRiskFactor = async (riskData: RiskFormValues): Promise<RiskFactor | null> => {
    const { data, error } = await supabase
        .from('risk_factors')
        .insert({
            student_id: riskData.studentId,
            category: riskData.category,
            level: riskData.level,
            notes: riskData.notes,
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding risk factor:', error);
        return null;
    }

    return {
        id: data.id,
        studentId: data.student_id,
        studentName: '', // Will be hydrated in context
        category: data.category,
        level: data.level,
        notes: data.notes,
    };
};

export const editRiskFactor = async (riskId: string, riskData: RiskFormValues): Promise<Partial<RiskFactor> | null> => {
    const { data, error } = await supabase
        .from('risk_factors')
        .update({
            category: riskData.category,
            level: riskData.level,
            notes: riskData.notes,
        })
        .eq('id', riskId)
        .select()
        .single();

    if (error) {
        console.error('Error editing risk factor:', error);
        return null;
    }
    return data;
};

// Settings
export const setSettingsService = async (settings: AppSettings): Promise<Partial<AppSettings> | null> => {
    const { data, error } = await supabase
        .from('settings')
        .update({ 
            allow_registration: settings.isRegistrationEnabled,
            app_name: settings.appName,
            institution_name: settings.institutionName,
            logo_url: settings.logoUrl,
            primary_color: settings.primaryColor,
        })
        .eq('id', 1)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating settings:', error);
        return null;
    }

    return {
        isRegistrationEnabled: data.allow_registration,
        appName: data.app_name,
        institutionName: data.institution_name,
        logoUrl: data.logo_url,
        primaryColor: data.primary_color,
        isDriveConnected: settings.isDriveConnected,
    };
};
