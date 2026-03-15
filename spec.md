# Task Turtle

## Current State
- Stripe integrated for wallet top-up (`createCheckoutSession`, `isStripeConfigured`, `setStripeConfiguration` in backend)
- `useCreateCheckoutSession` hook calls Stripe API via backend actor
- WalletPage has "Add Funds" button that opens Stripe checkout
- Escrow is handled internally by Motoko wallet balance system

## Requested Changes (Diff)

### Add
- Razorpay checkout.js SDK loaded via script tag
- `useRazorpayCheckout` hook: opens Razorpay checkout modal with UPI/card/netbanking options
- Amount selection UI (₹100, ₹200, ₹500, ₹1000, custom) before Razorpay opens
- Cashfree escrow branding on task posting flow ("Payment secured by Cashfree Escrow")
- Transaction state: pending → processing → success/failed UI in wallet page
- `RazorpayCheckoutModal` component: amount picker + Razorpay SDK integration

### Modify
- WalletPage: replace Stripe "Add Funds" button with Razorpay flow
- `useCreateCheckoutSession` → replace with `useRazorpayCheckout` (frontend-only SDK call)
- Dashboard task posting form: add "Payment will be held in Cashfree Escrow" note
- Remove all Stripe references in frontend UI and hooks

### Remove
- `useCreateCheckoutSession` hook (Stripe-specific)
- All Stripe branding/references from frontend
- Stripe success/cancel URL query param handling

## Implementation Plan
1. Remove `useCreateCheckoutSession` from useQueries.ts, replace with `useRazorpayCheckout` that loads Razorpay checkout.js and opens modal
2. Create `RazorpayCheckoutModal` component with amount picker (₹100/200/500/1000/custom)
3. Update WalletPage to use new Razorpay modal instead of Stripe button
4. Add Cashfree escrow notice to Dashboard task posting form
5. Remove Stripe success/cancel URL param handling
6. NOTE: Backend APIs unchanged - wallet balance still managed by Motoko canister
