# Specification

## Summary
**Goal:** Reduce post-deployment “Connection Failed” incidents by making actor initialization resilient (retries + manual retry) and by showing clear diagnostic information so users can recover without reloading.

**Planned changes:**
- Update frontend actor initialization flow to surface the underlying initialization error/message to the UI instead of only showing a generic “Connection Failed” state.
- Add automatic retry for actor initialization with exponential backoff and a finite number of attempts to handle transient backend unavailability after deploys.
- Ensure “Retry Connection” triggers a fresh actor initialization attempt without using a full page reload, and allow recovery into the authenticated flow without requiring re-login when retries succeed.
- Add a lightweight, anonymous backend health query (e.g., `ping`/`getStatus`) returning a small stable payload to distinguish “backend unreachable” from other initialization failures.
- Call the health query during the frontend connection/initialization path and use it to improve the error messaging when initialization fails.
- Improve the Connection Failed screen to show: a readable extracted error message (sanitized to stable English), an explicit “offline” hint when `navigator.onLine` is false, and an additional “Hard refresh” action that performs a cache-busting reload.

**User-visible outcome:** If the app can’t connect right after a deploy, users see a clearer error (including offline detection), the app retries automatically, and users can Retry, Logout & Retry, or Hard refresh to recover—often without reloading or re-logging in.
