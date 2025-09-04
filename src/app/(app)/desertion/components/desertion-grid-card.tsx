
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DropoutWithStudentInfo } from '@/hooks/use-desertion';

export const DesertionGridCard = ({ item: dropout, onClick }: { item: DropoutWithStudentInfo; onClick: (name: string) => void }) => (
    <Card 
        className="shadow-sm hover:shadow-lg hover:border-primary/50 transition-all rounded-xl group cursor-pointer border-2 border-transparent h-full"
        onClick={() => onClick(dropout.studentName)}
    >
        <CardContent className="p-4 flex flex-col items-center text-center gap-3 justify-center h-full">
             <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold text-xl">
                {dropout.studentName.split(' ').map(n => n[0]).join('').substring(0,2)}
             </div>
            <div className="flex flex-col items-center min-h-[56px]">
                <p className="font-semibold text-card-foreground leading-tight">{dropout.studentName}</p>
                {dropout.grade && dropout.section && (
                    <p className="text-xs text-muted-foreground">
                    {dropout.grade} - Sección {dropout.section}
                    </p>
                )}
            </div>
             <Badge variant="destructive" className="mt-auto pt-2">
                Deserción
            </Badge>
        </CardContent>
    </Card>
);
