
"use client";

import { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, BookUser, AlertTriangle, ArrowRight, TrendingUp, TrendingDown, GraduationCap, FileText } from "lucide-react";
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/app-context';
import { useStudents } from '@/hooks/use-students';
import { useIncidents } from '@/hooks/use-incidents';
import { usePersonnel } from '@/hooks/use-teachers';
import { useGradesAndSections } from '@/hooks/use-grades-and-sections';
import { cn } from "@/lib/utils";
import { DashboardLoading } from "@/components/dashboard-loading";

export default function TeacherDashboard() {
  const { currentUserProfile } = useAppContext();
  const { students, isLoading: studentsLoading } = useStudents();
  const { incidents, isLoading: incidentsLoading } = useIncidents();
  const { assignments, isLoading: assignmentsLoading } = usePersonnel();
  const { grades, isLoading: gradesLoading } = useGradesAndSections();
  
  const isLoading = assignmentsLoading || gradesLoading || studentsLoading || incidentsLoading;

  const { assignedSections, totalStudents, totalIncidents } = useMemo(() => {
    if (!currentUserProfile) return { assignedSections: [], totalStudents: 0, totalIncidents: 0 };

    const myAssignments = assignments.filter(a => a.teacher_id === currentUserProfile.id);
    const mySectionIds = new Set(myAssignments.map(a => a.section_id));
    
    const assignedSections = grades.flatMap(grade => 
        grade.sections
            .filter(section => mySectionIds.has(section.id))
            .map(section => ({ gradeName: grade.name, sectionName: section.name, gradeId: grade.id, sectionId: section.id }))
    ).sort((a,b) => `${a.gradeName} ${a.sectionName}`.localeCompare(`${b.gradeName} ${b.sectionName}`));

    const studentsInMySections = students.filter(s => mySectionIds.has(s.sectionId));
    const incidentsInMySections = incidents.filter(i => {
        const student = students.find(s => s.id === i.studentId);
        return student && mySectionIds.has(student.sectionId);
    });

    return { 
        assignedSections, 
        totalStudents: studentsInMySections.length, 
        totalIncidents: incidentsInMySections.length 
    };
  }, [currentUserProfile, assignments, grades, students, incidents]);

  const kpiData = useMemo(() => {
    const recentIncidents = incidents.filter(incident => {
      const incidentDate = new Date(incident.date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return incidentDate >= thirtyDaysAgo;
    }).length;
    
    return [
      {
        title: "Secciones Asignadas",
        value: assignedSections.length,
        icon: BookUser,
        trend: "+1",
        trendUp: true,
        gradient: "from-emerald-500 to-teal-600",
        bgGradient: "from-emerald-50 to-teal-100",
        iconColor: "text-emerald-600",
        description: "Grupos activos"
      },
      {
        title: "Total de Estudiantes",
        value: totalStudents,
        icon: Users,
        trend: "+3.2%",
        trendUp: true,
        gradient: "from-blue-500 to-cyan-600",
        bgGradient: "from-blue-50 to-cyan-100",
        iconColor: "text-blue-600",
        description: "Bajo tu supervisión"
      },
      {
        title: "Incidentes Registrados",
        value: totalIncidents,
        icon: AlertTriangle,
        trend: recentIncidents > 0 ? "+" + recentIncidents : "0",
        trendUp: recentIncidents === 0,
        gradient: "from-orange-500 to-red-600",
        bgGradient: "from-orange-50 to-red-100",
        iconColor: "text-orange-600",
        description: "Total registrados"
      },
    ];
  }, [assignedSections, totalStudents, totalIncidents, incidents]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Bienvenido(a), {currentUserProfile?.name.split(' ')[0]}</h1>
          <p className="text-muted-foreground">Aquí tiene un resumen de sus responsabilidades.</p>
        </div>
        <DashboardLoading type="teacher" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bienvenido(a), {currentUserProfile?.name.split(' ')[0]}</h1>
        <p className="text-muted-foreground">Aquí tiene un resumen de sus responsabilidades.</p>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {kpiData.map((kpi, index) => (
          <Card 
            key={kpi.title}
            className={cn(
              "relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1",
              "bg-gradient-to-br", kpi.bgGradient
            )}
            style={{
              animationDelay: `${index * 100}ms`,
              animation: "fadeInUp 0.6s ease-out forwards"
            }}
          >
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-5",
              kpi.gradient
            )} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.title}
                </CardTitle>
                <p className="text-xs text-muted-foreground/80">{kpi.description}</p>
              </div>
              <div className={cn(
                "p-3 rounded-xl bg-white/80 backdrop-blur-sm shadow-sm",
                kpi.iconColor
              )}>
                <kpi.icon className="h-6 w-6" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-end justify-between">
                <div className="text-3xl font-bold text-foreground">{kpi.value}</div>
                <div className="flex items-center gap-1 text-xs">
                  {kpi.trendUp ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  <span className={cn(
                    "font-medium",
                    kpi.trendUp ? "text-green-600" : "text-red-600"
                  )}>
                    {kpi.trend}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 mt-8 grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-indigo-50/30 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Accesos Directos</CardTitle>
                    <CardDescription>Realice sus tareas más comunes con un solo clic</CardDescription>
                  </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                 <Link href="/students">
                    <Button 
                      className="w-full justify-start bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 border-0" 
                      size="lg"
                    >
                        <Users className="mr-3 h-5 w-5" /> Ver mis Estudiantes
                    </Button>
                </Link>
                <Link href="/incidents/nuevo">
                    <Button 
                      className="w-full justify-start bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-200 border-0" 
                      size="lg"
                    >
                        <AlertTriangle className="mr-3 h-5 w-5" /> Registrar Incidente
                    </Button>
                </Link>
            </CardContent>
        </Card>
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-green-50/30 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-sm">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Mis Secciones</CardTitle>
                    <CardDescription>Secciones que tiene actualmente a su cargo</CardDescription>
                  </div>
                </div>
            </CardHeader>
            <CardContent>
                {assignedSections.length > 0 ? (
                     <div className="space-y-3">
                        {assignedSections.map((s, index) => (
                           <Link key={`${s.gradeId}-${s.sectionId}`} href={`/students/section/${s.gradeId}/${s.sectionId}`}>
                             <div 
                               className="flex items-center justify-between p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-gray-100 hover:bg-white/80 transition-all duration-200 hover:shadow-sm"
                               style={{
                                 animationDelay: `${index * 100}ms`,
                                 animation: "slideInLeft 0.5s ease-out forwards"
                               }}
                             >
                                <div className="flex items-center gap-3">
                                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-500" />
                                  <p className="font-medium text-foreground">{s.gradeName} - Sección {s.sectionName}</p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground"/>
                             </div>
                           </Link>
                        ))}
                     </div>
                ) : (
                    <div className="text-center py-12">
                      <BookUser className="h-12 w-12 text-green-500 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No tiene secciones asignadas aún.</p>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
