import { useActor } from './useActor';

/**
 * Extended hook that provides actor readiness state
 * Wraps the base useActor hook with additional computed states
 */
export function useActorReady() {
    const { actor, isFetching } = useActor();
    
    // Compute derived states from the base hook
    const isLoading = isFetching && !actor;
    const isReady = !!actor && !isFetching;
    const isError = false; // Base hook doesn't expose errors yet
    const error = null;
    
    const refetch = () => {
        // Trigger refetch by clearing and reloading
        window.location.reload();
    };
    
    return {
        actor,
        isFetching,
        isLoading,
        isReady,
        isError,
        error,
        refetch,
    };
}
