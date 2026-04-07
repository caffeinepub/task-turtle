# Task Turtle PWA

## Current State

Task Turtle is a full-stack ICP/React task marketplace with:
- React 19 + TypeScript + Tailwind frontend
- Motoko backend on ICP
- Pages: Landing, Dashboard, Tasker Dashboard, Admin Dashboard, Profile, Wallet, Pickup-Drop, Login
- Razorpay payment integration
- YouTube video slider on homepage
- Green + black neon theme
- index.html currently has minimal meta tags (no PWA support)
- No service worker, no manifest.json, no PWA install logic

## Requested Changes (Diff)

### Add
- `manifest.json` in `/public/` with full PWA fields (name, icons, theme, display=standalone, orientation=portrait)
- `sw.js` service worker in `/public/` with cache-first strategy, offline fallback, auto-update
- PWA icons: `icon-192.png` and `icon-512.png` (neon green turtle, maskable) in `/public/`
- `offline.html` fallback page in `/public/`
- `InstallPWA.tsx` component — smart install button (Android/iOS/Windows), beforeinstallprompt handling, iOS instructions sheet
- Service worker registration in `main.tsx`
- Notification permission request utility

### Modify
- `index.html` — add all PWA meta tags: theme-color, apple-mobile-web-app-capable, apple-mobile-web-app-status-bar-style, apple-touch-icon, viewport, og tags, manifest link, title
- `main.tsx` — register service worker on app boot
- App.tsx or LandingPage — mount `<InstallPWA />` banner intelligently (once per session, dismissable)

### Remove
- Nothing removed from existing features

## Implementation Plan

1. Generate PWA icons (192x192, 512x512) — neon green glossy turtle
2. Write `manifest.json` in `/public/` with all required fields + maskable icon
3. Write `sw.js` in `/public/` — cache-first for static assets, network-first for API calls, offline fallback HTML
4. Write `offline.html` in `/public/` — branded offline page
5. Update `index.html` with all Apple/PWA meta tags + manifest link
6. Create `InstallPWA.tsx` component with:
   - beforeinstallprompt capture
   - iOS Safari detection + "Add to Home Screen" instructions
   - Windows/Chrome install support
   - Smart show logic (localStorage flag, 3-day cooldown)
   - Dismissable banner UI
7. Register service worker in `main.tsx` with update detection
8. Add notification permission request hook
9. Mount `<InstallPWA />` in App.tsx
