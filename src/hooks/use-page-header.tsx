
"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react';

type PageHeaderContextType = {
  title: string;
  setTitle: (title: string) => void;
  actions: ReactNode | null;
  setActions: (actions: ReactNode | null) => void;
};

const PageHeaderContext = createContext<PageHeaderContextType | undefined>(undefined);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState('Panel de Control');
  const [actions, setActions] = useState<ReactNode | null>(null);

  return (
    <PageHeaderContext.Provider value={{ title, setTitle, actions, setActions }}>
      {children}
    </PageHeaderContext.Provider>
  );
}

export function usePageHeader() {
  const context = useContext(PageHeaderContext);
  if (context === undefined) {
    throw new Error('usePageHeader must be used within a PageHeaderProvider');
  }
  return context;
}
