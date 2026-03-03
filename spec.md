# Task Turtle

## Current State

New project. No existing code.

## Requested Changes (Diff)

### Add

**Landing Page**
- Hero section: "Any Task. Any Place. By Nearby People." tagline
- How It Works: 5-step visual flow (Post Task -> Set Amount -> Tasker Accepts -> OTP Verify -> Payment Released)
- Use cases section (groceries, errands, delivery, etc.)
- CTA: Post a Task button

**Authentication**
- Login / Register with name, phone, email
- User can act as both Customer and Tasker

**Customer Dashboard**
- Post new task: title, description, location (text), amount (INR), optional tip
- View all posted tasks with live status
- OTP display for task completion verification
- Task status timeline (Posted -> Accepted -> In Progress -> Delivered -> Complete)

**Tasker Dashboard**
- View available nearby tasks (sorted by distance/amount)
- Accept or reject tasks
- View active task details with navigation info
- Enter OTP to complete delivery
- Earnings wallet showing balance, platform fee breakdown, task history

**Live Task Screen**
- Real-time status timeline for a specific task
- OTP verification flow
- Task completion confirmation

**Wallet & Payments**
- Tasker earnings balance
- Per-task breakdown: amount, platform fee (5%), tasker earning
- Task history with payment status
- Stripe payment integration for escrow simulation

**Backend (Motoko)**
- User management: register, login (email+password auth via authorization component), profile update
- Task management: createTask, getTasks, getTaskById, acceptTask, completeTask (OTP verify), cancelTask
- Tasker flow: getAvailableTasks, acceptTask, submitOTP
- Payment logic: escrow simulation -- task amount locked on creation, released to tasker on OTP verification, platform fee deducted
- Wallet: getWalletBalance, getEarningsHistory
- OTP: generate 6-digit OTP on task acceptance, verify on completion

### Modify

Nothing -- new project.

### Remove

Nothing -- new project.

## Implementation Plan

1. Select components: authorization, stripe
2. Generate Motoko backend with: User profiles, Task CRUD, OTP generation/verification, Escrow/wallet logic, Tasker matching (distance-based sort)
3. Generate logo and hero visual assets
4. Build frontend:
   - Landing page with glossy green+black Blinkit-style UI
   - Auth pages (login/register)
   - Customer dashboard (post task, track tasks, OTP display)
   - Tasker dashboard (available tasks, accept/reject, OTP entry, wallet)
   - Live task screen (status timeline)
   - Wallet page (earnings, history)
5. Deploy
