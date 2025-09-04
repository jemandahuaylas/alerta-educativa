
"use client";

import { useState, useMemo } from 'react';
import { UserPlus, Users, Trash2, Edit } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { UserProfile, Assignment } from '@/core/domain/types';
import { useGradesAndSections } from '@/hooks/use-grades-and-sections';
import { usePersonnel } from '@/hooks/use-teachers';
import { AsignarDocenteModal } from './asignar/components/asignar-docente-modal';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import FloatingActionButton from '@/components/molecules/floating-action-button';
import { useRouter } from 'next/navigation';

export default function AsignarDocentePage() {
  const { grades } = useGradesAndSections();
  const { personnel, assignments, addAssignments, removeAssignment } = usePersonnel();
  const router = useRouter();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<{ gradeId: string; gradeName: string; sectionId: string; sectionName: string } | null>(null);

  const handleOpenAssignModal = (gradeId: string, gradeName: string, sectionId: string, sectionName: string) => {
    setSelectedSection({ gradeId, gradeName, sectionId, sectionName });
    setIsModalOpen(true);
  };

  const handleAssignTeachers = async (assignedPersonnel: UserProfile[]) => {
    if (selectedSection) {
      const newAssignments: Omit<Assignment, 'id'>[] = assignedPersonnel.map(person => ({
        teacher_id: person.id,
        grade_id: selectedSection.gradeId,
        section_id: selectedSection.sectionId,
      }));
      await addAssignments(newAssignments);
    }
    setIsModalOpen(false);
  };

  const handleRemoveTeacher = async (teacherId: string, gradeId: string, sectionId: string) => {
    const assignmentToRemove = assignments.find(a => 
      a.teacher_id === teacherId && a.grade_id === gradeId && a.section_id === sectionId
    );
    if (assignmentToRemove) {
      await removeAssignment(assignmentToRemove.id);
    }
  };

  const teachersBySection = useMemo(() => {
    const map = new Map<string, UserProfile[]>();
    assignments.forEach(assignment => {
      const sectionKey = `${assignment.grade_id}-${assignment.section_id}`;
      const person = personnel.find(t => t.id === assignment.teacher_id);
      if (person) {
        if (!map.has(sectionKey)) {
          map.set(sectionKey, []);
        }
        map.get(sectionKey)!.push(person);
      }
    });
    return map;
  }, [assignments, personnel]);

  const pageActions = (
    <Link href="/docentes/gestion">
        <Button>
            <Edit className="mr-2 h-4 w-4" />
            Gestionar Personal
        </Button>
    </Link>
  );
 
  return (
    <>
      <PageHeader
        title="Asignación de Personal"
        actions={pageActions}
      />
      
      {grades.length === 0 ? (
         <Card className="text-center py-12">
            <CardHeader>
                <CardTitle>No hay grados creados</CardTitle>
                <CardDescription>Para asignar personal, primero debe crear grados y secciones.</CardDescription>
            </CardHeader>
         </Card>
      ) : (
      <Accordion type="multiple" className="w-full space-y-4">
        {grades.map((grade) => (
          <AccordionItem value={grade.id} key={grade.id} className="border-0">
             <Card className="rounded-xl shadow-sm overflow-hidden">
                <AccordionTrigger className="p-6 text-lg font-semibold hover:no-underline w-full text-left [&[data-state=open]>svg]:rotate-180">
                    <div className="flex flex-col gap-1">
                        <span>{grade.name}</span>
                        <span className="text-sm font-normal text-muted-foreground">{grade.sections.length} secciones</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 pt-0">
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {grade.sections.map((section) => {
                      const sectionKey = `${grade.id}-${section.id}`;
                      const assignedPersonnel = teachersBySection.get(sectionKey) || [];
                      return (
                        <Card key={section.id} className="flex flex-col h-full">
                          <CardHeader className="flex-row items-center justify-between pb-4">
                              <CardTitle className="text-base font-medium">Sección {section.name}</CardTitle>
                              <Button 
                                variant="outline" 
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                onClick={() => handleOpenAssignModal(grade.id, grade.name, section.id, section.name)}
                              >
                                <UserPlus className="h-4 w-4" />
                                <span className="sr-only">Asignar Personal</span>
                            </Button>
                          </CardHeader>
                          <CardContent className="flex-grow">
                            {assignedPersonnel.length > 0 ? (
                              <div className="space-y-2">
                                {assignedPersonnel.map(person => (
                                  <Badge key={person.id} variant="secondary" className="group text-sm font-normal w-full flex justify-between items-center">
                                    <div className='flex flex-col items-start'>
                                      <span>{person.name.split(' ')[0]} {person.name.split(' ')[1]?.[0]}.</span>
                                      <span className='text-xs font-light'>{person.role}</span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 ml-1 opacity-50 group-hover:opacity-100"
                                      onClick={() => handleRemoveTeacher(person.id, grade.id, section.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                               <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Users className="h-4 w-4"/>
                                <span>No asignado</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </AccordionContent>
              </Card>
          </AccordionItem>
        ))}
      </Accordion>
      )}

      <FloatingActionButton 
        onClick={() => router.push('/docentes/gestion')}
        icon={<Edit className="h-6 w-6" />}
      />

      {isModalOpen && selectedSection && (
        <AsignarDocenteModal
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          teachers={personnel}
          onAssign={handleAssignTeachers}
          gradeName={selectedSection.gradeName}
          sectionName={selectedSection.sectionName}
        />
      )}
    </>
  );
}
