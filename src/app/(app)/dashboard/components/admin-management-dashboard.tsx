"use client";

import { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Users, 
  AlertTriangle, 
  TrendingDown, 
  UserMinus, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  FileText, 
  Shield, 
  BarChart3, 
  UserCheck, 
  Calendar, 
  Target,
  ArrowRight,
  Eye,
  Settings,
  BookOpen,
  GraduationCap,
  UserX,
  Activity
} from "lucide-react";
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { useAppContext } from '@/context/app-context';
import { useStudents } from '@/hooks/use-students';
import { useIncidents } from '@/hooks/use-incidents';
import { useRiskFactors } from '@/hooks/use-risk-factors';
import { useDesertion } from '@/hooks/use-desertion';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from "@/lib/utils";
import { DashboardLoading } from "@/components/dashboard-loading";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { format, subMonths, getMonth } from 'date-fns';
import { es } from 'date-fns/locale';

interface QuickActionProps {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

function QuickAction({ title, description, href, icon: Icon, color, bgColor }: QuickActionProps) {
  return (
    <Link href={href}>
      <div className={cn(
        "p-4 rounded-lg border transition-all duration-200 hover:shadow-md hover:-translate-y-1 cursor-pointer",
        "bg-gradient-to-br", bgColor
      )}>
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg text-white shadow-sm", color)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-sm">{title}</h4>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </Link>
  );
}

export default function AdminManagementDashboard() {
  const { currentUserProfile } = useAppContext();
  const { students, isLoading: studentsLoading } = useStudents();
  const { incidentsWithStudentInfo, isLoading: incidentsLoading } = useIncidents();
  const { risksWithStudentInfo, isLoading: risksLoading } = useRiskFactors();
  const { dropoutsWithStudentInfo, isLoading: dropoutsLoading } = useDesertion();
  const { permissions } = usePermissions();
  
  const isLoading = studentsLoading || incidentsLoading || risksLoading || dropoutsLoading;

  const dashboardData = useMemo(() => {
    const pendingIncidents = incidentsWithStudentInfo.filter(i => i.status === 'Pendiente').length;
    const resolvedIncidents = incidentsWithStudentInfo.filter(i => i.status === 'Atendido').length;
    const highRiskStudents = risksWithStudentInfo.filter(r => r.level === 'High').length;
    const mediumRiskStudents = risksWithStudentInfo.filter(r => r.level === 'Medium').length;
    const totalDropouts = dropoutsWithStudentInfo.length;
    const pendingPermissions = permissions.filter(p => p.status === 'Pendiente').length;
    const approvedPermissions = permissions.filter(p => p.status === 'Aprobado').length;
    
    // Datos para gráficos
    const incidentsByMonth = Array.from({ length: 6 }, (_, i) => {
      const month = subMonths(new Date(), 5 - i);
      const monthIncidents = incidentsWithStudentInfo.filter(incident => {
        const incidentMonth = getMonth(new Date(incident.date));
        return incidentMonth === getMonth(month);
      }).length;
      return {
        month: format(month, 'MMM', { locale: es }),
        incidents: monthIncidents
      };
    });

    const riskDistribution = [
      { name: 'Alto Riesgo', value: highRiskStudents, color: '#ef4444' },
      { name: 'Riesgo Medio', value: mediumRiskStudents, color: '#f59e0b' },
      { name: 'Bajo Riesgo', value: students.length - highRiskStudents - mediumRiskStudents, color: '#10b981' }
    ];

    return {
      pendingIncidents,
      resolvedIncidents,
      highRiskStudents,
      totalDropouts,
      pendingPermissions,
      approvedPermissions,
      incidentsByMonth,
      riskDistribution
    };
  }, [students, incidentsWithStudentInfo, risksWithStudentInfo, dropoutsWithStudentInfo, permissions]);

  const kpiData = useMemo(() => [
    {
      title: "Total de Estudiantes",
      value: students.length.toString(),
      icon: Users,
      trend: "+2.5%",
      trendUp: true,
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50 to-blue-100",
      iconColor: "text-blue-600",
      description: "Estudiantes activos"
    },
    {
      title: "Incidentes Pendientes",
      value: dashboardData.pendingIncidents.toString(),
      icon: AlertTriangle,
      trend: dashboardData.pendingIncidents > dashboardData.resolvedIncidents ? "+12%" : "-8%",
      trendUp: dashboardData.pendingIncidents <= dashboardData.resolvedIncidents,
      gradient: "from-amber-500 to-orange-600",
      bgGradient: "from-amber-50 to-orange-100",
      iconColor: "text-amber-600",
      description: "Requieren aprobación"
    },
    {
      title: "Estudiantes Alto Riesgo",
      value: dashboardData.highRiskStudents.toString(),
      icon: TrendingDown,
      trend: "-5.2%",
      trendUp: true,
      gradient: "from-red-500 to-red-600",
      bgGradient: "from-red-50 to-red-100",
      iconColor: "text-red-600",
      description: "Necesitan seguimiento"
    },
    {
      title: "Permisos Pendientes",
      value: dashboardData.pendingPermissions.toString(),
      icon: Clock,
      trend: dashboardData.pendingPermissions === 0 ? "0%" : "+3.1%",
      trendUp: dashboardData.pendingPermissions === 0,
      gradient: "from-purple-500 to-purple-600",
      bgGradient: "from-purple-50 to-purple-100",
      iconColor: "text-purple-600",
      description: "Esperan aprobación"
    },
  ], [students, dashboardData]);

  const quickActions = [
    {
      title: "Revisar Incidentes",
      description: "Aprobar o rechazar incidentes",
      href: "/incidents",
      icon: AlertTriangle,
      color: "bg-gradient-to-r from-orange-500 to-red-600",
      bgColor: "from-orange-50 to-red-100"
    },
    {
      title: "Gestionar Permisos",
      description: "Aprobar solicitudes de permisos",
      href: "/permissions",
      icon: FileText,
      color: "bg-gradient-to-r from-blue-500 to-indigo-600",
      bgColor: "from-blue-50 to-indigo-100"
    },
    {
      title: "Estudiantes en Riesgo",
      description: "Monitorear factores de riesgo",
      href: "/students?filter=risk",
      icon: Shield,
      color: "bg-gradient-to-r from-red-500 to-pink-600",
      bgColor: "from-red-50 to-pink-100"
    },
    {
      title: "Reportes y Estadísticas",
      description: "Ver análisis detallados",
      href: "/reports",
      icon: BarChart3,
      color: "bg-gradient-to-r from-green-500 to-emerald-600",
      bgColor: "from-green-50 to-emerald-100"
    },
    {
      title: "Gestión de Docentes",
      description: "Administrar personal docente",
      href: "/docentes",
      icon: UserCheck,
      color: "bg-gradient-to-r from-purple-500 to-violet-600",
      bgColor: "from-purple-50 to-violet-100"
    },
    {
      title: "Configuración",
      description: "Ajustes del sistema",
      href: "/settings",
      icon: Settings,
      color: "bg-gradient-to-r from-gray-500 to-slate-600",
      bgColor: "from-gray-50 to-slate-100"
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Panel de Control Administrativo</h1>
          <p className="text-muted-foreground">Bienvenido(a), {currentUserProfile?.name.split(' ')[0]}</p>
        </div>
        <DashboardLoading type="admin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          Panel de Control Administrativo
        </h1>
        <p className="text-muted-foreground mt-2">
          Bienvenido(a), {currentUserProfile?.name.split(' ')[0]} • {currentUserProfile?.role}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Charts and Quick Actions */}
      <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
        {/* Incidents Chart */}
        <Card className="lg:col-span-2 shadow-lg border-0 bg-gradient-to-br from-white to-blue-50/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Tendencia de Incidentes</CardTitle>
                <CardDescription>Incidentes registrados en los últimos 6 meses</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.incidentsByMonth}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="incidents" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk Distribution */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-red-50/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-pink-600 text-white shadow-sm">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Distribución de Riesgo</CardTitle>
                <CardDescription>Clasificación de estudiantes por nivel de riesgo</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={dashboardData.riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dashboardData.riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {dashboardData.riskDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
              <CardDescription>Acceda rápidamente a las funciones más utilizadas</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action, index) => (
              <QuickAction
                key={action.title}
                title={action.title}
                description={action.description}
                href={action.href}
                icon={action.icon}
                color={action.color}
                bgColor={action.bgColor}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Summary */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-green-50/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-sm">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Actividad Reciente</CardTitle>
                <CardDescription>Resumen de acciones completadas</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Incidentes Resueltos</span>
                </div>
                <Badge variant="secondary">{dashboardData.resolvedIncidents}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Permisos Aprobados</span>
                </div>
                <Badge variant="secondary">{dashboardData.approvedPermissions}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <UserX className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Total Deserciones</span>
                </div>
                <Badge variant="secondary">{dashboardData.totalDropouts}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-purple-50/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-sm">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Supervisión</CardTitle>
                <CardDescription>Elementos que requieren su atención</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Link href="/incidents?status=pending">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-gray-100 hover:bg-white/80 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">Incidentes Pendientes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">{dashboardData.pendingIncidents}</Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </Link>
              <Link href="/permissions?status=pending">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-gray-100 hover:bg-white/80 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">Permisos por Aprobar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{dashboardData.pendingPermissions}</Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </Link>
              <Link href="/students?filter=high-risk">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-gray-100 hover:bg-white/80 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-red-600" />
                    <span className="text-sm">Estudiantes Alto Riesgo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">{dashboardData.highRiskStudents}</Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}