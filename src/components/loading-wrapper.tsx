"use client";

import React from 'react';
import { useAppContext } from '@/context/app-context';
import { OptimizedLoading } from '@/components/ui/optimized-loading';

export function LoadingWrapper({ children }: { children: React.ReactNode }) {
  const {
    isLoading,
    loadingSteps,
    currentStep,
    loadingError,
    retryOperation
  } = useAppContext();

  return (
    <>
      {children}
      <OptimizedLoading
        isLoading={isLoading}
        steps={loadingSteps}
        currentStep={currentStep}
        error={loadingError}
        onRetry={retryOperation}
        timeout={15000} // 15 seconds timeout for faster user feedback
        onTimeout={() => {
          console.warn('Operación demorada detectada');
        }}
      />
    </>
  );
}