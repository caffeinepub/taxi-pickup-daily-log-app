import { useEffect } from 'react';

/**
 * Android Chrome Overlay Cleanup Hook
 * 
 * Purpose: Defensively remove stale scroll-locking styles/attributes from
 * document/body when no Dialog is open, preventing frozen scrolling after
 * dropdown menu interactions on Android Chrome.
 * 
 * This hook runs on mount and whenever the component using it re-renders,
 * checking if any dialogs are currently open. If no dialogs are open, it
 * removes any leftover scroll-lock attributes that may have been applied
 * by Radix UI components.
 */
export function useRadixOverlayCleanup() {
  useEffect(() => {
    const cleanup = () => {
      // Check if any dialogs are currently open
      const hasOpenDialog = document.querySelector('[data-radix-dialog-content]');
      
      if (!hasOpenDialog) {
        // No dialogs open - ensure body is not scroll-locked
        document.body.removeAttribute('data-scroll-locked');
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.touchAction = '';
        document.body.style.pointerEvents = '';
      }
    };

    // Run cleanup on mount and after a short delay to catch any transitions
    cleanup();
    const timeoutId = setTimeout(cleanup, 100);

    return () => clearTimeout(timeoutId);
  });
}
