import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface DashboardLoadingProps {
  type?: 'admin' | 'teacher';
}

export function DashboardLoading({ type = 'admin' }: DashboardLoadingProps) {
  const kpiCount = type === 'admin' ? 4 : 3;
  
  return (
    <div className="space-y-8">
      {/* KPI Cards Loading */}
      <div className={cn(
        "grid gap-6 grid-cols-1 sm:grid-cols-2",
        type === 'admin' ? "lg:grid-cols-4" : "lg:grid-cols-3"
      )}>
        {Array.from({ length: kpiCount }).map((_, index) => (
          <Card 
            key={index}
            className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-gray-50 to-gray-100"
            style={{
              animationDelay: `${index * 100}ms`,
              animation: "fadeInUp 0.6s ease-out forwards"
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-12 w-12 rounded-xl" />
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <Skeleton className="h-8 w-16" />
                <div className="flex items-center gap-1">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-3 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Cards Loading */}
      <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card 
            key={index}
            className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/50"
          >
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, itemIndex) => (
                  <div 
                    key={itemIndex}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-gray-100"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Skeleton className="h-2 w-2 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function KPICardSkeleton() {
  return (
    <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-gray-50 to-gray-100">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <Skeleton className="h-8 w-16" />
          <div className="flex items-center gap-1">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}