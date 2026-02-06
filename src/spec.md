# Specification

## Summary
**Goal:** Prevent authenticated users from getting stuck on an infinite “Initializing…” spinner by surfacing actor initialization errors and providing an in-app retry.

**Planned changes:**
- Update `frontend/src/hooks/useActor.ts` to expose explicit actor status (`isLoading`, `isReady`, `isError`, `error`) and a callable retry/refetch mechanism.
- Configure sensible, finite React Query retry behavior for actor initialization so transient failures retry and persistent failures converge to an error state.
- Update `frontend/src/hooks/useActorReady.ts` to reflect real loading/error state (remove hard-coded non-error values).
- Update `frontend/src/components/ActorInitializationGate.tsx` to show loading only while initializing, and to render an error Alert with English text and a Retry button when initialization fails; on successful retry, render children without refresh/re-login.

**User-visible outcome:** If backend/actor initialization fails after login, users see a clear error message and can retry initialization from the same screen instead of being stuck on “Initializing…”.
