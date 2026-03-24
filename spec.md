# Task Turtle

## Current State
UPI feature was added to User model (upiId: ?Text in backend, optional string in frontend). After this change, the Users and Taskers tables in the Admin Dashboard stopped showing data. The `useAdminAllUsers` hook silently swallows errors (returns [] on catch), so React Query's `isError` never fires. There is no separate `useAdminTaskers` hook. The frontend may crash on null/undefined upiId access in some code paths.

## Requested Changes (Diff)

### Add
- `useAdminTaskers` hook that derives taskers from users with console.log logging
- Error re-throw in hooks so React Query properly tracks `isError`
- Null-safe upiId access throughout AdminDashboard

### Modify
- `useAdminAllUsers`: re-throw errors instead of returning [] silently, add console.log on success
- `useAdminTaskers` (new derived hook): logs response, filters isAvailableAsTasker=true
- AdminDashboard: use `useAdminTaskers` for logging; ensure all `upiId` accesses use `|| ''` or ternary guard; fallback rows already present
- Normalize upiId: treat undefined/null both as "No UPI"

### Remove
- Silent error swallowing in admin hooks

## Implementation Plan
1. Update `useQueries.ts`: fix `useAdminAllUsers` to throw errors, add `useAdminTaskers` hook
2. Update `AdminDashboard.tsx`: import `useAdminTaskers`, add tasker log, harden all upiId accesses
