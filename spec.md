# Task Turtle

## Current State
Task Turtle is a fully functional hyper-local task marketplace. Users post real-world tasks and taskers complete them for payment. The admin dashboard has 6 tabs (Overview, All Tasks, Users, Taskers, Payments, Manual Payouts) showing live backend data. The `PublicUserProfile` model currently has: id, name, phone, location, rating, walletBalance, isAvailableAsTasker. The `updateProfile` backend function accepts (name, phone, location, isAvailableAsTasker). There is no UPI ID field anywhere in the system.

## Requested Changes (Diff)

### Add
- `upiId: ?Text` field to `PublicUserProfile` Motoko type
- `upiId: ?Text` parameter to `updateProfile` backend function
- UPI ID input field on ProfilePage (required when tasker mode is ON, with `@` validation)
- UPI ID column in Admin Taskers tab with Copy button
- Tasker UPI ID column in Admin All Tasks tab with Copy button and "No UPI" warning badge
- `upiId?: string` to frontend `PublicUserProfile` type declarations
- `upiId` parameter to `useUpdateProfile` hook mutation

### Modify
- `updateProfile` Motoko function: accept and store `upiId`
- `rateTask` Motoko function: preserve `upiId` when rebuilding profile objects
- `saveCallerUserProfile` references: include `upiId`
- `useEnsureProfile` and `useProfile` fallback calls to `actor.updateProfile` to pass `null` as 5th arg
- ProfilePage: sync `upiId` from profile, include in save
- AdminDashboard Taskers tab: replace "Location / UPI" with separate Location + UPI ID columns
- AdminDashboard All Tasks tab: add Tasker UPI column
- AdminDashboard TaskerProfileDialog: show dedicated UPI ID field

### Remove
- Nothing removed

## Implementation Plan
1. Update `PublicUserProfile` type in main.mo to add `upiId: ?Text`
2. Update `updateProfile` in main.mo to accept and store `upiId`
3. Update `rateTask` in main.mo to preserve `upiId` in both profile update blocks
4. Update frontend type declarations (backend.d.ts, backend.did.d.ts) with `upiId`
5. Update `useUpdateProfile` hook to include `upiId` parameter
6. Update fallback `actor.updateProfile` calls in useEnsureProfile/useProfile to pass null 5th arg
7. Add UPI ID field to ProfilePage with validation (required for taskers)
8. Add UPI ID column + copy button to AdminDashboard Taskers tab
9. Add Tasker UPI column + copy button + warning badge to AdminDashboard All Tasks tab
