"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface LoadingStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'completed' | 'error';
  duration?: number;
}

interface OptimizedLoadingProps {
  isLoading: boolean;
  steps?: LoadingStep[];
  currentStep?: string;
  progress?: number;
  error?: string | null;
  onRetry?: () => void;
  timeout?: number; // in milliseconds
  onTimeout?: () => void;
}

export function OptimizedLoading({
  isLoading,
  steps = [],
  currentStep,
  progress,
  error,
  onRetry,
  timeout = 30000, // 30 seconds default
  onTimeout
}: OptimizedLoadingProps) {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setTimeElapsed(0);
      setHasTimedOut(false);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setTimeElapsed(elapsed);

      if (elapsed >= timeout && !hasTimedOut) {
        setHasTimedOut(true);
        onTimeout?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoading, timeout, hasTimedOut, onTimeout]);

  if (!isLoading && !error) return null;

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    return `${seconds}s`;
  };

  const getProgressPercentage = () => {
    if (progress !== undefined) return progress;
    if (steps.length === 0) return undefined;
    
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    return (completedSteps / steps.length) * 100;
  };

  const getCurrentStepInfo = () => {
    if (currentStep) {
      const step = steps.find(s => s.id === currentStep);
      return step?.label || currentStep;
    }
    
    const loadingStep = steps.find(s => s.status === 'loading');
    return loadingStep?.label || 'Procesando...';
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full mx-4 border">
        {error ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <h3 className="font-semibold">Error en la operación</h3>
            </div>
            
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            
            {onRetry && (
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={onRetry}>
                  Reintentar
                </Button>
              </div>
            )}
          </div>
        ) : hasTimedOut ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-amber-600">
              <Clock className="h-5 w-5" />
              <h3 className="font-semibold">Operación demorada</h3>
            </div>
            
            <Alert>
              <AlertDescription>
                La operación está tomando más tiempo del esperado. Esto puede deberse a la carga del servidor.
                Puedes esperar un poco más o intentar nuevamente.
              </AlertDescription>
            </Alert>
            
            <div className="text-sm text-muted-foreground">
              Tiempo transcurrido: {formatTime(timeElapsed)}
            </div>
            
            {onRetry && (
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={onRetry}>
                  Reintentar
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <h3 className="font-semibold">Procesando</h3>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                {getCurrentStepInfo()}
              </div>
              
              {getProgressPercentage() !== undefined && (
                <Progress value={getProgressPercentage()} className="w-full" />
              )}
              
              <div className="text-xs text-muted-foreground flex justify-between">
                <span>Tiempo: {formatTime(timeElapsed)}</span>
                {timeout && (
                  <span>Timeout en: {formatTime(timeout - timeElapsed)}</span>
                )}
              </div>
            </div>
            
            {steps.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Progreso:</div>
                <div className="space-y-1">
                  {steps.map((step) => (
                    <div key={step.id} className="flex items-center space-x-2 text-sm">
                      {step.status === 'completed' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : step.status === 'loading' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : step.status === 'error' ? (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-muted" />
                      )}
                      <span className={step.status === 'completed' ? 'text-green-600' : 
                                    step.status === 'error' ? 'text-destructive' : 
                                    step.status === 'loading' ? 'text-foreground' : 'text-muted-foreground'}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Hook para manejar estados de loading con pasos
export function useOptimizedLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const [steps, setSteps] = useState<LoadingStep[]>([]);
  const [currentStep, setCurrentStep] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  const startLoading = (initialSteps: LoadingStep[] = []) => {
    setIsLoading(true);
    setSteps(initialSteps);
    setCurrentStep(undefined);
    setError(null);
  };

  const updateStep = (stepId: string, status: LoadingStep['status']) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
    
    if (status === 'loading') {
      setCurrentStep(stepId);
    }
  };

  const setLoadingError = (errorMessage: string) => {
    setError(errorMessage);
    setIsLoading(false);
  };

  const finishLoading = () => {
    setIsLoading(false);
    setCurrentStep(undefined);
    setError(null);
  };

  const retry = () => {
    setError(null);
    setIsLoading(true);
    // Reset all steps to pending
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending' as const })));
  };

  return {
    isLoading,
    steps,
    currentStep,
    error,
    startLoading,
    updateStep,
    setLoadingError,
    finishLoading,
    retry
  };
}