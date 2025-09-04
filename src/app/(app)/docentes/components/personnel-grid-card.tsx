
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { UserProfile } from '@/core/domain/types';

export const PersonnelGridCard = ({ 
    item: person,
}: { 
    item: UserProfile;
}) => (
    <Card className="shadow-sm hover:shadow-lg hover:border-primary/50 transition-all rounded-xl group cursor-pointer border-2 border-transparent h-full">
        <CardContent className="p-4 flex flex-col items-center text-center gap-3 justify-center h-full">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold text-xl">
              {person.name.split(' ').map(n => n[0]).join('').substring(0,2)}
            </div>
            <div className="flex flex-col items-center min-h-[56px]">
                <p className="font-semibold text-card-foreground leading-tight">{person.name}</p>
                <Badge variant="outline" className="mt-1">{person.role}</Badge>
            </div>
        </CardContent>
    </Card>
);
