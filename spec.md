# Task Turtle

## Current State
- Task Turtle is a fully functional hyper-local task marketplace with Daily Tasks and Pickup-Drop Tasks as separate modules
- My Profile has UPI ID and Aadharcard Details / Student ID fields but saving fails with IDL error (aadharOrStudentId not serialized in backend.ts)
- Admin dashboard has 6 tabs: Overview, All Tasks, Users, Taskers, Payments, Manual Payouts — but no Pickup-Drop section
- Admin has no visibility or control over Pickup-Drop tasks
- Homepage has a "How Task Turtle Works" section for Daily Tasks but no section for Pickup-Drop
- Footer shows copyright only, no founder credit
- backend.ts serializers (from_candid_record_n16, to_candid_record_n24) were missing aadharOrStudentId field — FIXED
- backend.did.js and declarations now include PickupDrop types/methods — FIXED
- main.mo now has getAllPickupDropTasks, getAllPickupDropActiveTasks, adminCancelPickupDropTask — ADDED

## Requested Changes (Diff)

### Add
- Admin dashboard: New 7th tab "Pickup-Drop" with:
  - Table of all Pickup-Drop tasks (ID, pickup loc, drop loc, product worth, tasker fee, status, posted by, created date)
  - Row click → full detail modal showing all fields including tasker UPI ID and Aadharcard details
  - Admin can cancel any Pickup-Drop task (with confirmation)
  - Manual payout section for Pickup-Drop: shows tasker name, UPI ID, amount to pay, mark as paid
  - Search and filter by status
- Homepage: "How Pickup-Drop Works" section with 6 animated step cards:
  1. User Posts Task — user fills pickup details, drop details, product worth (security amount)
  2. Tasker Finds Task — tasker browses Pickup-Drop section in Find Task
  3. Tasker Accepts & Pays Deposit — tasker pays product worth as security deposit
  4. Tasker Gets Full Details — after payment, complete pickup/drop contact info revealed
  5. Tasker Completes Delivery — tasker picks up, delivers, verifies with OTP
  6. Payout Released — Task Turtle transfers full profit + security deposit back to tasker
- Footer: Add "Founder of Task Turtle: Thakur Ayush Singh" text

### Modify
- Profile save: aadharOrStudentId now properly serialized (already fixed in backend.ts)
- Admin users/taskers profile modal: ensure UPI ID and Aadharcard details are visible

### Remove
- Nothing removed

## Implementation Plan
1. Add `useAdminAllPickupDropTasks` hook in useQueries.ts fetching `getAllPickupDropTasks()`
2. Add `useAdminCancelPickupDropTask` mutation hook calling `adminCancelPickupDropTask()`
3. Add PickupDropTab component inside AdminDashboard.tsx with table, detail modal, cancel, manual payout
4. Add 7th tab "Pickup-Drop" to TABS array in AdminDashboard.tsx
5. Add PickupDropTaskStatus badge helper
6. Add "How Pickup-Drop Works" section to LandingPage.tsx (after existing "How Task Turtle Works" section)
7. Update footer in LandingPage.tsx to include founder text
