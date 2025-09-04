"use client";

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DropoutWithStudentInfo } from '@/hooks/use-desertion';

export const DesertionListCard = ({ item: dropout, onClick }: { item: DropoutWithStudentInfo; onClick: (name: string) => void }) => (
    <Card 
        className="shadow-sm hover:shadow-md transition-shadow p-2 pr-4 cursor-pointer"
        onClick={() => onClick(dropout.studentName)}
    >
        <div className="grid grid-cols-[auto,1fr,auto] items-center gap-4">
            <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold">
                {dropout.studentName.charAt(0)}
            </div>
            <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{dropout.studentName}</p>
                <p className="text-xs text-muted-foreground truncate">{dropout.grade} - Sección {dropout.section}</p>
            </div>
            
            <Badge variant="destructive">
                Deserción
            </Badge>
        </div>
    </Card>
);