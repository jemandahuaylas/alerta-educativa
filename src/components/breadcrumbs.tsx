
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { useGradesAndSections } from '@/hooks/use-grades-and-sections';
import { Button } from './ui/button';

const Breadcrumbs = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { grades } = useGradesAndSections();
  const pathSegments = pathname.split('/').filter(Boolean);

  const breadcrumbNameMap: { [key: string]: string } = {
    'dashboard': 'Panel de Control',
    'students': 'Estudiantes',
    'docentes': 'Docentes',
    'incidents': 'Incidentes',
    'permisos': 'Permisos',
    'nee': 'NEE',
    'risk-assessment': 'Evaluación de Riesgos',
    'desertion': 'Deserción',
    'settings': 'Ajustes',
    'gestion': 'Gestión',
    'nuevo': 'Nuevo',
    'registrar': 'Registrar',
    'asignar': 'Asignar',
  };

  if (pathname === '/dashboard') {
    return null;
  }
  
  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
    let name = breadcrumbNameMap[segment] || segment;
    let isLink = true;

    // Logic for student section pages: /students/section/[gradeId]/[sectionId]
    if (pathSegments[0] === 'students' && pathSegments[1] === 'section' && pathSegments.length > 2) {
      if (index === 1) { // "section" segment
        return null; // Don't show "section" segment
      }
      if (index === 2) { // gradeId segment
        const grade = grades.find(g => g.id === segment);
        name = grade ? grade.name : segment;
        isLink = false;
      }
      if (index === 3) { // sectionId segment
        const grade = grades.find(g => g.id === pathSegments[2]);
        const section = grade?.sections.find(s => s.id === segment);
        name = section ? section.name : segment;
      }
    } else if (index === pathSegments.length -1) {
       isLink = false;
    }


    return { path, name, isLink };
  }).filter(Boolean);


  return (
    <nav aria-label="Breadcrumb" className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground mb-2">
      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" />
        <span className="sr-only">Volver</span>
      </Button>
      {breadcrumbs.map((breadcrumb, index) => {
        if (!breadcrumb) return null;
        const isLast = index === breadcrumbs.length - 1;

        return (
          <React.Fragment key={breadcrumb.path}>
            <ChevronRight className="h-4 w-4" />
            {(isLast || !breadcrumb.isLink) ? (
              <span className="font-medium text-foreground">{breadcrumb.name}</span>
            ) : (
              <Link href={breadcrumb.path} className="hover:text-foreground">
                {breadcrumb.name}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
