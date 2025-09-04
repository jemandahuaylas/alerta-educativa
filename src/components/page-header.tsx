
"use client"

import type { FC, ReactNode } from 'react';
import { useEffect } from 'react';
import { usePageHeader } from '@/hooks/use-page-header';
import Breadcrumbs from './breadcrumbs';

type PageHeaderProps = {
  title: string;
  actions?: ReactNode;
};

const PageHeader: FC<PageHeaderProps> = ({ title, actions }) => {
  const { setTitle, setActions } = usePageHeader();

  useEffect(() => {
    setTitle(title);
    setActions(actions || null);
    
    // Cleanup actions when component unmounts
    return () => {
        setActions(null);
    }
  }, [title, actions, setTitle, setActions]);
  
  return (
    <div className="hidden sm:block mb-8">
      <Breadcrumbs />
      <div className="flex items-center justify-between gap-4 mt-2">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
