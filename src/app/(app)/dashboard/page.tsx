
"use client"

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, AlertTriangle, TrendingDown, UserMinus, TrendingUp, Clock, CheckCircle } from "lucide-react";
import PageHeader from "@/components/page-header";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Badge } from "@/components/ui/badge";
import { useStudents } from "@/hooks/use-students";
import { useIncidents } from "@/hooks/use-incidents";
import { useRiskFactors } from "@/hooks/use-risk-factors";
import { useDesertion } from "@/hooks/use-desertion";
import { format, subMonths, getMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAppContext } from "@/context/app-context";
import TeacherDashboard from "./components/teacher-dashboard";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { DashboardLoading } from "@/components/dashboard-loading";

function AdminDashboard() {
  const { students, isLoading: studentsLoading } = useStudents();
  const { incidentsWithStudentInfo, isLoading: incidentsLoading } = useIncidents();
  const { risksWithStudentInfo, isLoading: risksLoading } = useRiskFactors();
  const { dropoutsWithStudentInfo, isLoading: dropoutsLoading } = useDesertion();
  
  const isLoading = studentsLoading || incidentsLoading || risksLoading || dropoutsLoading;

  const kpiData = useMemo(() => {
    const pendingIncidents = incidentsWithStudentInfo.filter(i => i.status === 'Pendiente').length;
    const resolvedIncidents = incidentsWithStudentInfo.filter(i => i.status === 'Atendido').length;
    const highRiskStudents = risksWithStudentInfo.filter(r => r.level === 'High').length;
    const totalDropouts = dropoutsWithStudentInfo.length;
    
    return [
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
        value: pendingIncidents.toString(),
        icon: AlertTriangle,
        trend: pendingIncidents > resolvedIncidents ? "+12%" : "-8%",
        trendUp: pendingIncidents <= resolvedIncidents,
        gradient: "from-amber-500 to-orange-600",
        bgGradient: "from-amber-50 to-orange-100",
        iconColor: "text-amber-600",
        description: "Requieren atención"
      },
      {
        title: "Estudiantes en Riesgo Alto",
        value: highRiskStudents.toString(),
        icon: TrendingDown,
        trend: "-5.2%",
        trendUp: true,
        gradient: "from-red-500 to-red-600",
        bgGradient: "from-red-50 to-red-100",
        iconColor: "text-red-600",
        description: "Necesitan seguimiento"
      },
      {
        title: "Total de Deserciones",
        value: totalDropouts.toString(),
        icon: UserMinus,
        trend: totalDropouts === 0 ? "0%" : "+3.1%",
        trendUp: totalDropouts === 0,
        gradient: "from-purple-500 to-purple-600",
        bgGradient: "from-purple-50 to-purple-100",
        iconColor: "text-purple-600",
        description: "Este período"
      },
    ];
  }, [students, incidentsWithStudentInfo, risksWithStudentInfo, dropoutsWithStudentInfo]);

  const dropoutChartData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), 5 - i));
    const data = months.map(month => ({
      month: format(month, 'MMM', { locale: es }),
      value: 0
    }));

    dropoutsWithStudentInfo.forEach(dropout => {
      const dropoutMonth = getMonth(new Date(dropout.dropoutDate));
      const monthIndex = months.findIndex(m => getMonth(m) === dropoutMonth);
      if (monthIndex !== -1) {
        data[monthIndex].value += 1;
      }
    });

    return data;
  }, [dropoutsWithStudentInfo]);

  const recentIncidents = useMemo(() => 
    incidentsWithStudentInfo
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4)
      .map(incident => ({
        id: incident.id,
        studentName: incident.studentName,
        type: incident.incidentTypes[0] || 'Incidente'
      })), 
  [incidentsWithStudentInfo]);

  if (isLoading) {
    return (
      <>
        <PageHeader title="Panel de Control" />
        <DashboardLoading type="admin" />
      </>
    );
  }
  
  return (
    <>
      <PageHeader
        title="Panel de Control"
      />
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
      <div className="grid gap-8 mt-8 grid-cols-1 lg:grid-cols-2">
         <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-sm">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Incidentes Recientes</CardTitle>
                    <CardDescription>Últimos incidentes registrados en el sistema</CardDescription>
                  </div>
                </div>
            </CardHeader>
            <CardContent>
                {recentIncidents.length > 0 ? (
                    <div className="space-y-3">
                    {recentIncidents.map((incident, index) => (
                        <div 
                          key={incident.id} 
                          className="flex items-center justify-between p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-gray-100 hover:bg-white/80 transition-all duration-200 hover:shadow-sm"
                          style={{
                            animationDelay: `${index * 100}ms`,
                            animation: "slideInLeft 0.5s ease-out forwards"
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-400 to-red-500" />
                            <p className="text-sm font-medium text-foreground">{incident.studentName}</p>
                          </div>
                          <Badge 
                            variant="secondary" 
                            className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border-orange-200 hover:from-orange-200 hover:to-red-200 transition-all duration-200"
                          >
                            {incident.type}
                          </Badge>
                        </div>
                    ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">¡Excelente! No hay incidentes recientes.</p>
                    </div>
                )}
            </CardContent>
         </Card>
         <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-purple-50/30 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-sm">
                    <TrendingDown className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Tendencia de Deserción</CardTitle>
                    <CardDescription>Número de deserciones estudiantiles en los últimos 6 meses</CardDescription>
                  </div>
                </div>
            </CardHeader>
            <CardContent>
                <ChartContainer config={{}} className="h-[240px] w-full">
                    <BarChart accessibilityLayer data={dropoutChartData}>
                        <XAxis
                          dataKey="month"
                          stroke="#6b7280"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          className="text-muted-foreground"
                        />
                        <YAxis
                          stroke="#6b7280"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                          className="text-muted-foreground"
                        />
                        <ChartTooltip
                            cursor={{ fill: 'rgba(139, 92, 246, 0.1)', radius: 8 }}
                            content={<ChartTooltipContent 
                              indicator="dot" 
                              className="bg-white/95 backdrop-blur-sm border border-purple-200 shadow-lg rounded-lg"
                            />}
                        />
                        <Bar 
                          dataKey="value" 
                          fill="url(#purpleGradient)" 
                          radius={[6, 6, 0, 0]} 
                          name="Deserciones"
                          className="hover:opacity-80 transition-opacity duration-200"
                        />
                        <defs>
                          <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
                          </linearGradient>
                        </defs>
                    </BarChart>
                </ChartContainer>
            </CardContent>
         </Card>
      </div>
    </>
  );
}

export default function DashboardPage() {
  const { currentUserProfile } = useAppContext();

  const isRestrictedUser = currentUserProfile?.role === 'Docente' || currentUserProfile?.role === 'Auxiliar';

  if (isRestrictedUser) {
    return <TeacherDashboard />;
  }
  
  return <AdminDashboard />;
}
