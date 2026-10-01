# Phase 2: Visual Overhaul — "Midnight Ocean"

> **Priority:** 🔴 Critical  
> **Depends on:** Phase 1 (Bugfix & Cleanup)  
> **Estimated time:** ~2 hours  
> **Files affected:** 12+ files  
> **Design direction:** Premium dark-themed chat with glassmorphism and gradient accents

---

## Goal
Transform the app from a generic Shadcn starter into a visually stunning dark-themed chat application with unique brand identity, smooth animations, and premium aesthetics.

## Tasks

### 2.1 — New Color System in index.css
- **File:** `apps/web/src/index.css`
- **Action:** Replace the default Shadcn light/dark theme variables with the "Midnight Ocean" palette:
  - `:root` → Light mode (clean, bright but not sterile)
  - `.dark` → Dark mode as DEFAULT (navy/charcoal base, cyan accent)
  - Key colors:
    ```
    --background: #0f1419       (deep charcoal)
    --foreground: #e7e9ea       (soft white)
    --primary: #06b6d4 → #0ea5e9 (cyan-teal gradient)
    --card: #1a1f2e             (elevated surface)
    --muted: #2a3040            (subtle surface)
    --accent: #f59e0b           (warm amber for CTAs)
    --border: rgba(255,255,255,0.08)
    --destructive: #ef4444
    ```
  - Add custom utility classes:
    ```css
    .glass { backdrop-filter: blur(12px); background: rgba(255,255,255,0.05); }
    .glow-sm { box-shadow: 0 0 15px rgba(6,182,212,0.15); }
    ```
  - Add custom scrollbar styles (thin, themed)
  - Add Inter font import from Google Fonts
- **Verify:** `pnpm dev` → App renders in dark mode with new palette

### 2.2 — Apply dark class to HTML root
- **File:** `apps/web/index.html`
- **Action:** Add `class="dark"` to `<html>` element so dark mode is default. Also add Google Fonts link for Inter
  ```html
  <html lang="en" class="dark">
    <head>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    </head>
  ```
- **Verify:** Page loads in dark mode immediately

### 2.3 — Redesign LoginPage with split-screen layout
- **File:** `apps/web/src/pages/auth/LoginPage.tsx`
- **Action:** Replace the plain centered card with a split-screen layout:
  - **Left side (60%):** Animated gradient background with floating brand elements
    - Large "NhanZ" logo text with gradient
    - Tagline: "Where conversations come alive"
    - Subtle animated particles or mesh gradient
    - Floating chat bubble decorations
  - **Right side (40%):** Dark glass panel with the login form
    - Form fields with custom dark styling
    - Gradient submit button with hover glow
    - Smooth field focus animations
    - Social login placeholders (Google, GitHub icons)
  - Responsive: On mobile, left panel becomes a top header
- **Verify:** Login page looks premium with animated gradient + glass form panel

### 2.4 — Redesign RegisterPage matching LoginPage
- **File:** `apps/web/src/pages/auth/RegisterPage.tsx`
- **Action:** Apply same split-screen layout as LoginPage. Share the left panel component. Right side has the 4-field register form with matching dark glass styling
- **Verify:** Register page matches Login page design language

### 2.5 — Redesign Sidebar with glass effect
- **File:** `apps/web/src/pages/chat/Sidebar.tsx`
- **Action:** Transform sidebar into a premium dark panel:
  - **Header area:**
    - User avatar with gradient ring border (online color based on status)
    - Name with subtle font-weight hierarchy
    - New chat button with hover glow
  - **Search bar:**
    - Glass-effect background with subtle border
    - Animated search icon on focus
  - **Conversation list:**
    - Each item: rounded card with hover state that has left-border accent
    - Active item: subtle gradient background + left cyan border
    - Avatar with online/offline dot indicator
    - Truncated last message preview
    - Timestamp in muted text
    - Unread count badge (prepare UI, logic in Phase 3)
  - **Overall:** Subtle separator lines using `border-white/5`
  - Width increased from `w-80` to `w-[340px]`
- **Verify:** Sidebar feels like Discord/Telegram quality with glass effects and hover states

### 2.6 — Redesign ChatPage main area
- **File:** `apps/web/src/pages/chat/ChatPage.tsx`
- **Action:**
  - **Chat header:** Dark glass bar with:
    - Avatar + name + online status dot
    - Phone/Video/More buttons with hover glow
    - Subtle bottom border with gradient
  - **Message area:**
    - Subtle mesh gradient background (very faint)
    - Own messages: Gradient bubble (cyan→teal) with rounded corners, `rounded-br-sm`
    - Other's messages: Dark glass bubble with border, `rounded-bl-sm`
    - Avatar next to messages (already exists, restyle)
    - Timestamp below bubble, smaller
    - Message entrance animation (slide up + fade in, already using framer-motion)
  - **Empty state:**
    - Large animated icon (pulse animation)
    - Gradient text: "Start a conversation"
    - Descriptive subtitle
  - **Input area:**
    - Floating pill input with glass effect
    - Attachment button (📎) on left (UI only, logic in Phase 4)
    - Emoji button placeholder
    - Send button: gradient cyan circle with hover scale
    - Typing indicator: animated dots (•••) instead of text
- **Verify:** Chat area looks premium with gradient bubbles and glass input

### 2.7 — Redesign ChatLayout wrapper
- **File:** `apps/web/src/pages/chat/ChatLayout.tsx`
- **Action:** Add subtle background pattern/gradient to the main layout wrapper. Ensure sidebar + main area have proper transition between them
- **Verify:** Full layout feels cohesive

### 2.8 — Restyle modal components
- **Files:**
  - `apps/web/src/components/SettingsModal.tsx`
  - `apps/web/src/components/PrivacyModal.tsx`
  - `apps/web/src/components/SecurityModal.tsx`
  - `apps/web/src/components/NewChatModal.tsx`
- **Action:** Update all modals to match dark theme:
  - Dark glass dialog background
  - Consistent form field styling
  - Gradient primary buttons
  - Subtle animations on open/close (already handled by Radix)
- **Verify:** All 4 modals render beautifully in dark theme

### 2.9 — Custom scrollbar styling
- **File:** `apps/web/src/index.css`
- **Action:** Add thin, themed scrollbar for Webkit and Firefox:
  ```css
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
  ```
- **Verify:** Scrollbars are thin and themed in sidebar and chat area

### 2.10 — Add loading states
- **Files:** `ChatPage.tsx`, `Sidebar.tsx`, `NewChatModal.tsx`
- **Action:** Add skeleton loaders or spinner states:
  - Sidebar: Pulse skeleton cards while conversations load
  - Chat: Skeleton messages while loading history
  - NewChatModal: Skeleton user cards while fetching users
- **Verify:** Loading states appear briefly before data loads

---

## Design Reference Checklist
- [x] No plain white/grey backgrounds remain
- [x] All interactive elements have hover/focus states
- [x] Gradient accent appears on primary actions
- [x] Glass effects on elevated surfaces
- [x] Consistent border-radius (rounded-xl default)
- [x] Custom scrollbars everywhere
- [x] Font is Inter throughout
- [x] Animations are smooth (60fps, reduced-motion respected)

## Done When
- [x] All 10 tasks checked off
- [x] App opens in dark mode by default
- [x] Login/Register pages have split-screen premium layout
- [x] Sidebar has glass effect with hover states
- [x] Chat bubbles use gradient (own) / glass (other)
- [x] Input area is floating pill with glass effect
- [x] All modals match dark theme
- [x] Loading states exist for async data
- [x] Scrollbars are themed
- [x] No visual regressions — all existing features still work
