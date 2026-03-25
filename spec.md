# Task Turtle

## Current State
UPI feature added across stack. Needs full rollback.

## Requested Changes (Diff)

### Add
Nothing

### Modify
- main.mo: remove upiId from PublicUserProfile, upiIds map, updateProfile param
- backend.d.ts: remove upiId from types
- useQueries.ts: remove upiId normalization and useAdminTaskers
- ProfilePage.tsx: remove UPI field
- AdminDashboard.tsx: remove UPI columns/copy buttons

### Remove
- upiIds map, upiId field, useAdminTaskers, UPI console logs

## Implementation Plan
1. Fix backend main.mo
2. Fix backend.d.ts
3. Fix useQueries.ts
4. Fix ProfilePage.tsx
5. Fix AdminDashboard.tsx
