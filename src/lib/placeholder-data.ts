
import { Student, UserProfile, Incident, Permission, RiskFactor, Dropout, Grade, NEE, Assignment } from '@/core/domain/types';

export const mockGrades: Grade[] = [];


export const mockStudents: Student[] = [];

export const mockTeachers: UserProfile[] = [];

export const mockAdminUsers: UserProfile[] = [];

export const mockAssignments: Assignment[] = [];

export const initialIncidentTypes = [
    "Interrupción en clase",
    "Falta de respeto al personal",
    "Conflicto con compañero",
    "Uso de lenguaje inapropiado",
    "No completar tareas",
    "Ausencia injustificada",
    "Vandalismo",
    "Acoso (Bullying)",
];

export const initialPermissionTypes = [
    'Excursión',
    'Autorización de Medios',
    'Permiso Médico',
    'Salida Temprana',
    'Uso de Imagen',
];

export const initialNeeDiagnosisTypes = [
    "TDAH",
    "Dislexia",
    "Discalculia",
    "Trastorno del Espectro Autista (TEA)",
    "Discapacidad Intelectual",
    "Trastornos del Lenguaje",
];

export const initialDropoutReasons = [
    "Problemas Familiares",
    "Reubicación",
    "Dificultades Académicas",
    "Problemas de Salud",
];


export const mockRiskFactors: RiskFactor[] = [];

export const mockDropouts: Dropout[] = [];

export const mockNees: NEE[] = [];
