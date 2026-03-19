# Task Turtle – Admin Control Dashboard Overhaul

## Current State
- Admin dashboard exists (`AdminDashboard.tsx`, 1114 lines) with 4 tabs: Overview, All Tasks, Taskers, All Users
- Backend has: `getAllTasks()`, `getAllUserProfiles()`, `getPlatformStats()`, `cancelTask()` (user-only, not admin)
- No payment tracking table, no payout management system
- cancelTask() only allows task owner to cancel, not admin
- No payment logs stored in backend
- No payout records or manual payout tracking

## Requested Changes (Diff)

### Add
- Backend: `adminCancelTask(taskId)` – admin can cancel any task regardless of status/owner
- Backend: `PaymentLog` type + `paymentLogs` stable map to record every payment event
- Backend: `addPaymentLog(taskId, userPaid, taskerEarnings, platformFee, status)` for internal recording
- Backend: `getPaymentLogs()` – admin query to fetch all payment records
- Backend: `PayoutRecord` type + `payoutRecords` stable map
- Backend: `getPendingPayouts()` – admin query returns all payout records
- Backend: `markPayoutPaid(taskId, method, date)` – admin marks a payout as Paid
- Frontend: Full rewrite of AdminDashboard with 6 tabs: Overview, Tasks, Users, Taskers, Payments, Payouts
- Frontend: Tasks table with Task ID, Title, Description, Posted By, Price, Status, Created Date; clickable rows; Cancel with confirmation dialog
- Frontend: Users table with Name, Phone, Email, Tasks Posted, Amount Spent, Wallet Balance; click → profile modal with task + payment history
- Frontend: Taskers table with Name, Phone, Completed Tasks, Active Tasks, Total Earnings, Pending Payout; click → profile modal
- Frontend: Payments table with Task ID, User Paid, Tasker Earnings, Platform Fee, Status, Date
- Frontend: Payouts table with Task ID, Tasker Name, Amount, Status (Pending/Paid), Method (UPI/Cash), Date; Mark as Paid action
- Frontend: Search + filter (by status, date range) on all tables
- Frontend: Pagination (20 rows per page) on all tables
- Frontend: Dark theme consistent with existing green+black design

### Modify
- `cancelTask()` backend: add admin bypass path OR create separate `adminCancelTask()`
- AdminDashboard.tsx: full replacement with new 6-tab structure

### Remove
- Old summary-only overview in admin (replace with richer stats cards + tables)

## Implementation Plan
1. Update `main.mo`: add PaymentLog type, PayoutRecord type, adminCancelTask, getPaymentLogs, getPendingPayouts, markPayoutPaid; auto-create payout record when task completed
2. Regenerate backend bindings (backend.d.ts)
3. Rewrite AdminDashboard.tsx with 6 fully functional tabs, tables, search, filter, pagination, modals
4. Wire all backend calls using actor methods from declarations
5. Validate (lint, typecheck, build)
