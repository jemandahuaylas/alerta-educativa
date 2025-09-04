
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type StudentSummary = {
    id: string; // Required for ResourceListView key
    studentName: string;
    grade?: string;
    section?: string;
    neeCount: number;
    diagnoses: string[];
};

export const NeeGridCard = ({ item: summary, onClick }: { item: StudentSummary; onClick: (name: string) => void }) => (
    <Card 
        className="shadow-sm hover:shadow-lg hover:border-primary/50 transition-all rounded-xl group cursor-pointer border-2 border-transparent h-full"
        onClick={() => onClick(summary.studentName)}
    >
        <CardContent className="p-4 flex flex-col items-center text-center gap-3 justify-center h-full">
             <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold text-xl">
                {summary.studentName.split(' ').map(n => n[0]).join('').substring(0,2)}
             </div>
            <div className="flex flex-col items-center min-h-[56px]">
                <p className="font-semibold text-card-foreground leading-tight">{summary.studentName}</p>
                {summary.grade && summary.section && (
                    <p className="text-xs text-muted-foreground">
                    {summary.grade} - Sección {summary.section}
                    </p>
                )}
            </div>
            {summary.neeCount > 0 && (
                <Badge variant="secondary" className="mt-auto pt-2">
                {summary.neeCount} {summary.neeCount === 1 ? 'registro' : 'registros'}
                </Badge>
            )}
        </CardContent>
    </Card>
);
