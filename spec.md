# Task Turtle

## Current State

Task Turtle is a fully deployed hyper-local task marketplace. Key existing features:
- PostTaskForm uses Cashfree payment modal with a flat ₹4 platform fee calculation
- Find Tasks tab (Daily + Pickup-Drop) shows amount + tip but no tasker-specific earning breakdown
- TaskCard (My Tasks) shows amount/tip but no full payment breakdown
- Tasker Dashboard shows available/active tasks with amount+tip total, no clear earning display
- AdminDashboard has 7 tabs; All Tasks tab shows task detail dialog with customer/tasker info but NO eye icon profile viewer on table rows
- Admin dashboard already shows UPI/Aadhar in detail dialogs, but NOT in taskers table directly
- Footer in LandingPage shows "Founder: Thakur Ayush Singh" but not "Ayush Singh Rajput" in green
- No task card image system exists (no keyword-to-image matching)
- Task cards have no image thumbnail
- Tasker Dashboard sections not tab-based; headings not bold/highlighted

## Requested Changes (Diff)

### Add
- Payment breakdown section in PostTaskForm above Pay button: Amount, Tasker Fee (tip), Boost (if selected), Platform Fee, Total Payable
- Platform fee calculation rules: ₹0-99→₹4, ₹100-299→₹7, ₹300-500→₹10
- Payment breakdown in TaskCard (My Tasks view): show Amount, Tasker Fee, Boost, Platform Fee, Total Paid
- Task Card Image System: keyword matching from title/description to show relevant product image; fallback to TaskTurtle logo
- Tasker earning display on all task cards (Find Tasks, Available Tasks): "Buy Item: ₹X" + "Earn: ₹Y (₹A fee + ₹B boost)" or "Earn: ₹Y" — no platform fee shown
- Validation: minimum tasker fee ₹10; boost options ₹10 or ₹20 only
- Tasker Dashboard: sticky tabs layout on mobile with bold headings, card/tab-based sections
- Admin dashboard: Show UPI ID in Taskers tab table rows ("Not Provided" if empty)
- Admin dashboard: eye 👁 icon in All Tasks table next to "Posted By" and "Accepted By" columns — clicking opens full user profile modal
- Footer update: replace/augment with "Founder of TaskTurtle" and "Ayush Singh Rajput" in green color, center aligned

### Modify
- PostTaskForm: change "tip" field to "Tasker Fee" (minimum ₹10 validation); add Boost select (₹0/₹10/₹20); switch from Cashfree to Razorpay; update total calculation with tiered platform fee
- FindTaskCard: replace amount display with earning-focused view ("Buy Item: ₹X", "Earn: ₹Y")
- AvailableTaskCard in TaskerDashboard: same earning-focused display
- TaskCard (My Tasks): add payment breakdown section
- TaskerDashboard: wrap Available Tasks and My Active Tasks sections in tabs/cards with sticky behavior on mobile; bold headings with emoji
- AdminDashboard All Tasks tab: add eye icon buttons in table rows for user profile quick-view
- AdminDashboard Taskers tab: add UPI ID column
- LandingPage footer: update to "Founder of TaskTurtle" + "Ayush Singh Rajput" in green

### Remove
- Cashfree payment modal usage in PostTaskForm (replace with Razorpay)
- Old flat ₹4 platform fee calculation (replace with tiered)
- "Made with Caffeine AI" if still present anywhere in footer

## Implementation Plan

1. **Payment Breakdown + Razorpay in PostTaskForm**: 
   - Rename "tip" to "Tasker Fee"; add taskerFeeINR state with ₹10 min validation
   - Add Boost select: none/₹10/₹20
   - Compute platform fee: amount 0-99→4, 100-299→7, 300-500→10
   - total = amount + taskerFee + boost + platformFee
   - Show breakdown card above submit button
   - Change submit to open Razorpay modal (rzp_live_SRNbTwyEmzQSvO) instead of Cashfree
   - On payment success → createTask with taskerFee as tip field

2. **Task Card Image System**:
   - Create `getTaskImage(title, description)` utility that maps keywords to image URLs
   - Keywords: banana, milk, medicine, grocery, bread, vegetables, fruits, water, rice, etc.
   - Use emoji-based or colored placeholder if no image available
   - Apply to: FindTaskCard, AvailableTaskCard, TaskCard, MiniPickupDropCard
   - Image shown on top of card on mobile, rounded corners

3. **Tasker Earning Display**:
   - On task cards in Find Tasks / Available Tasks: show "Buy Item: ₹X" and "Earn: ₹Y" where Y = tasker fee (tip field)
   - If boost: "Earn: ₹Y (₹A fee + ₹B boost)"
   - Do NOT show platform fee or commission

4. **Post-Task Payment Breakdown in My Tasks**:
   - In TaskCard: show Amount, Tasker Fee, Boost, Platform Fee, Total Paid
   - Derive from task.amount and task.tip

5. **Tasker Dashboard UI**:
   - Wrap Available Tasks + My Active Tasks into sticky tab buttons on mobile
   - Bold headings with 📋 and 🚀 emoji
   - Card/tab layout with visual distinction

6. **Admin: UPI in Taskers Tab**:
   - Add UPI ID column to taskers table
   - Show value or "Not Provided" badge

7. **Admin: Eye Icon Profile View in All Tasks**:
   - Add Eye icon button in All Tasks table next to Posted By and Accepted By
   - Clicking opens a UserProfileModal with: Name, Phone, Email, UPI ID, Aadhar details, task stats

8. **Footer Update**:
   - Center-aligned footer section
   - "Founder of TaskTurtle" label
   - "Ayush Singh Rajput" in green (text-green-vivid)

9. **Responsiveness**:
   - All new components must use responsive grid/flex
   - min-w-0, truncate on text
   - Touch-friendly button sizing (min h-11)
