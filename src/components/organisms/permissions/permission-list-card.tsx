"use client";

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PermissionWithStudentInfo } from '@/hooks/use-permissions';

type StudentSummary = {
    id: string; 
    studentName: string;
    grade?: string;
    section?: string;
    permissionCount: number;
    pendingCount: number;
};

export const PermissionListCard = ({ item: summary, onClick }: { item: StudentSummary; onClick: (name: string) => void }) => (
    <Card 
        className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => onClick(summary.studentName)}
    >
        <div className="p-2 pr-4 grid grid-cols-[auto,1fr,auto] items-center gap-4">
            <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold">
              {summary.studentName.charAt(0)}
            </div>
            <div className="min-w-0">
                <p className="font-semibold truncate text-sm">{summary.studentName}</p>
                <p className="text-xs text-muted-foreground truncate">{summary.grade} - Sección {summary.section}</p>
            </div>
            <div className="flex-shrink-0 flex flex-col sm:flex-row items-end sm:items-center gap-1">
                <Badge variant="secondary">{summary.permissionCount} {summary.permissionCount === 1 ? 'perm.' : 'perms.'}</Badge>
                {summary.pendingCount > 0 && <Badge variant="destructive">{summary.pendingCount} pend.</Badge>}
            </div>
        </div>
    </Card>
);
