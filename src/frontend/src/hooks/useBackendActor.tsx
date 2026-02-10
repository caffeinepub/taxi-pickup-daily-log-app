import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useInternetIdentity } from './useInternetIdentity';
import { type backendInterface } from '../backend';
import { createActorWithConfig } from '../config';
import { retryWithBackoff } from '../utils/retryBackoff';
import { HealthCheckResult } from '../utils/connectionDiagnostics';

interface BackendActorState {
  actor: backendInterface | null;
  isLoading: boolean;
  isReady: boolean;
  isError: boolean;
  error: unknown;
  healthCheck: HealthCheckResult | null;
  refetch: () => void;
}

const BackendActorContext = createContext<BackendActorState | null>(null);

export function useBackendActor(): BackendActorState {
  const context = useContext(BackendActorContext);
  if (!context) {
    throw new Error('useBackendActor must be used within BackendActorProvider');
  }
  return context;
}

interface BackendActorProviderProps {
  children: ReactNode;
}

export function BackendActorProvider({ children }: BackendActorProviderProps) {
  const { identity } = useInternetIdentity();
  const [actor, setActor] = useState<backendInterface | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [healthCheck, setHealthCheck] = useState<HealthCheckResult | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = useCallback(() => {
    setRefetchTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function checkHealth(): Promise<HealthCheckResult> {
      try {
        const anonymousActor = await createActorWithConfig();
        const status = await anonymousActor.getStatus();
        return {
          success: true,
          timestamp: Date.now(),
          message: `Backend is reachable (status: ${status.status})`,
        };
      } catch (err) {
        return {
          success: false,
          timestamp: Date.now(),
          message: 'Backend health check failed',
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }

    async function initializeActor() {
      setIsLoading(true);
      setError(null);
      setActor(null);

      try {
        // First, check backend health
        const health = await checkHealth();
        if (!cancelled) {
          setHealthCheck(health);
        }

        // Then initialize actor with retries
        const initializedActor = await retryWithBackoff(
          async () => {
            const isAuthenticated = !!identity;

            if (!isAuthenticated) {
              return await createActorWithConfig();
            }

            const actorOptions = {
              agentOptions: {
                identity,
              },
            };

            const newActor = await createActorWithConfig(actorOptions);
            await newActor.initializeAccessControl();
            return newActor;
          },
          {
            maxAttempts: 5,
            initialDelayMs: 500,
            maxDelayMs: 10000,
            backoffMultiplier: 2,
          }
        );

        if (!cancelled) {
          setActor(initializedActor);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Actor initialization failed after retries:', err);
        if (!cancelled) {
          setError(err);
          setIsLoading(false);
        }
      }
    }

    initializeActor();

    return () => {
      cancelled = true;
    };
  }, [identity, refetchTrigger]);

  const isReady = !!actor && !isLoading;
  const isError = !isLoading && !actor && !!error;

  return (
    <BackendActorContext.Provider
      value={{
        actor,
        isLoading,
        isReady,
        isError,
        error,
        healthCheck,
        refetch,
      }}
    >
      {children}
    </BackendActorContext.Provider>
  );
}
