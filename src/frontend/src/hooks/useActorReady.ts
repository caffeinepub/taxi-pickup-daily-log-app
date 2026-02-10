import { useBackendActor } from './useBackendActor';

/**
 * Extended hook that provides actor readiness state
 * Now wraps the new BackendActorProvider instead of the immutable useActor
 */
export function useActorReady() {
  const { actor, isLoading, isReady, isError, error, refetch } = useBackendActor();

  return {
    actor,
    isFetching: isLoading,
    isLoading,
    isReady,
    isError,
    error,
    refetch,
  };
}
