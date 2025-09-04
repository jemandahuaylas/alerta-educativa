"use client";

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type StudentSummary = {
    id: string; // Required for ResourceListView key
    studentName: string;
    grade?: string;
    section?: string;
    neeCount: number;
    diagnoses: string[];
};

export const NeeListCard = ({ item: summary, onClick }: { item: StudentSummary; onClick: (name: string) => void }) => (
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
            
            <div className="flex flex-wrap gap-1 justify-end max-w-xs">
               {summary.diagnoses.slice(0, 2).map(d => <Badge key={d} variant="secondary">{d}</Badge>)}
               {summary.diagnoses.length > 2 && <Badge variant="outline">+{summary.diagnoses.length - 2}</Badge>}
            </div>
        </div>
    </Card>
);