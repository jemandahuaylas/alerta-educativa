

export type Grade = {
  id: string;
  name: string;
  sections: Section[];
};

export type Section = {
  id: string;
  name: string;
};

export type Student = {
  id: string;
  first_name: string; // Corresponds to the database column
  last_name: string; // Corresponds to the database column
  firstName: string;
  lastName: string;
  name: string;
  dni: string;
  grade: string;
  section: string;
  gradeId: string;
  sectionId: string;
};

export type Incident = {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  incidentTypes: string[];
  status: 'Pendiente' | 'Atendido';
  followUpNotes?: string | null;
  registeredBy?: string | null;
  attendedBy?: string | null;
  attendedDate?: string | null;
  attendedById?: string | null;
};

export type Permission = {
  id: string;
  studentId: string;
  studentName: string;
  permissionTypes: string[];
  requestDate: string;
  status: 'Pendiente' | 'Aprobado' | 'Rechazado';
};

export type RiskFactor = {
  id: string;
  studentId: string;
  studentName: string;
  category: 'Attendance' | 'Academic Performance' | 'Family Situation';
  level: 'Low' | 'Medium' | 'High';
  notes: string;
};

export type Dropout = {
  id: string;
  studentId: string;
  studentName: string;
  dropoutDate: string;
  reason: string;
  notes: string;
};

export type NEE = {
  id: string;
  studentId: string;
  studentName: string;
  diagnosis: string;
  evaluationDate: string;
  supportPlan: string | null;
};

export type Assignment = {
  id: string;
  teacher_id: string;
  grade_id: string;
  section_id: string;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Director' | 'Subdirector' | 'Coordinador' | 'Docente' | 'Auxiliar';
  dni?: string;
};

export type UserProfileFormValues = Omit<UserProfile, 'id'> & { id?: string, password?: string };
