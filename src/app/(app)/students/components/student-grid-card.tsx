
"use client";

import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import type { Student } from '@/core/domain/types';

export const StudentGridCard = ({ 
    item: student,
}: { 
    item: Student;
}) => (
    <Card className="shadow-sm hover:shadow-lg hover:border-primary/50 transition-all rounded-xl group cursor-pointer border-2 border-transparent h-full">
        <CardContent className="p-4 flex flex-col items-center text-center gap-3 justify-center h-full">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold text-xl">
              {student.firstName.charAt(0)}{student.lastName.charAt(0)}
            </div>
            <div className="flex flex-col items-center min-h-[56px]">
              <CardTitle className="text-base font-semibold leading-tight">{student.lastName}, {student.firstName}</CardTitle>
              <CardDescription className="text-xs">DNI: {student.dni}</CardDescription>
            </div>
        </CardContent>
    </Card>
);
