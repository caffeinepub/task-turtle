# Task Turtle — Pickup-Drop Task System

## Current State

Task Turtle has a fully functional Daily Task system:
- Backend: `main.mo` with Task, profiles, tasks HashMap
- Frontend: Dashboard.tsx (Post Task, My Tasks, Find Tasks tabs), TaskerDashboard.tsx
- Hooks: useQueries.ts with all daily task hooks
- Routes: /dashboard (customer), /tasker (tasker hub)

All existing code MUST remain untouched.

## Requested Changes (Diff)

### Add
- New Motoko types in main.mo: `PickupDropTask`, `PickupDropActiveTask`, `PickupDropTaskStatus`
- New backend functions (appended to main.mo, separate Maps):
  - `createPickupDropTask(...)` → stores in `pickupDropTasks` Map
  - `getAvailablePickupDropTasks()` → public query
  - `acceptPickupDropTask(taskId, paymentDone)` → requires payment flag true
  - `getMyPickupDropTasks()` → tasks where caller is poster
  - `getMyActivePickupDropTasks()` → tasks where caller is tasker
  - `markPickupDropInProgress(taskId)`
  - `markPickupDropDelivered(taskId)`
  - `verifyPickupDropOtp(taskId, otp)` → marks complete, payout released
- New frontend page: `PickupDropPage.tsx`
  - Form to post Pickup-Drop tasks (pickup details, drop details, financials)
  - List of available Pickup-Drop tasks with Accept + payment popup
  - My Pickup-Drop Tasks section
- New component: `CategorySelector.tsx` — shown when user clicks Post Task, gives choice between Daily Task and Pickup-Drop Task
- New hooks in `usePickupDropQueries.ts` — completely separate from useQueries.ts
- Route `/pickup-drop` added to App.tsx
- Navbar link for Pickup-Drop
- Update Dashboard.tsx Post Task tab: show CategorySelector first, then either existing PostTaskForm or redirect to /pickup-drop
- Update Dashboard.tsx Find Tasks tab: add category tabs (Daily / Pickup-Drop)
- Update TaskerDashboard.tsx: add "My Pickup-Drop Tasks" section below existing sections

### Modify
- `Dashboard.tsx` — Post Task tab shows CategorySelector first (wrapper only, existing PostTaskForm unchanged)
- `Dashboard.tsx` — Find Tasks tab adds category filter tabs at top
- `TaskerDashboard.tsx` — adds My Pickup-Drop Tasks section at bottom
- `App.tsx` — adds /pickup-drop route
- `Navbar.tsx` — adds Pickup-Drop nav link
- `main.mo` — appends new types and functions (no modification to existing lines)
- `backend.d.ts` — adds new PickupDrop interfaces

### Remove
- Nothing removed

## Implementation Plan

1. Append Pickup-Drop types and functions to main.mo:
   - `PickupDropTaskStatus` variant
   - `PickupDropTask` type with all required fields
   - `PickupDropActiveTask` type
   - Separate `pickupDropTasks` and `pickupDropActiveTasks` Maps
   - CRUD functions

2. Add new interfaces to backend.d.ts and backend.ts IDL (PickupDropTask, PickupDropActiveTask)

3. Create `src/frontend/src/hooks/usePickupDropQueries.ts` with all PD-specific hooks

4. Create `src/frontend/src/pages/PickupDropPage.tsx` with:
   - Post form (pickup/drop fields + financials)
   - Available PD tasks list with earning display (net after 15% cut)
   - Accept popup with Product Worth payment gate
   - My PD tasks section

5. Create `src/frontend/src/components/CategorySelector.tsx`

6. Modify `Dashboard.tsx` Post Task tab to show CategorySelector

7. Modify `Dashboard.tsx` Find Tasks tab to add Daily/Pickup-Drop filter tabs

8. Modify `TaskerDashboard.tsx` to add My Pickup-Drop Tasks section

9. Add route and nav link
