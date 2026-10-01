# Phase 3: Core Features

> **Priority:** 🟡 High  
> **Depends on:** Phase 2 (Visual Overhaul)  
> **Estimated time:** ~2 hours  
> **Scope:** Dark mode toggle, online presence, unread badges, group chat UI, proper JWT middleware

---

## Goal
Add essential chat features that users expect from a modern messaging app: dark mode control, real-time presence, unread notifications, group chat creation, and proper authentication middleware.

## Tasks

### 3.1 — Dark Mode Toggle
- **Files:**
  - `apps/web/src/stores/useAuthStore.ts` → Add `theme` state
  - `apps/web/src/pages/chat/Sidebar.tsx` → Add toggle button
  - `apps/web/src/index.css` → Ensure light mode variables are polished too
- **Action:**
  - Add `theme: 'dark' | 'light'` to auth store with localStorage persistence
  - Toggle button in sidebar header (Sun/Moon icon)
  - On toggle: add/remove `dark` class from `document.documentElement`
  - Light mode should also look good (not just default Shadcn)
- **Verify:** Click toggle → Theme switches smoothly. Persists on reload

### 3.2 — Online Presence System (Real-time)
- **Server changes:**
  - `apps/server/src/index.ts` → Track connected users with `Map<userId, socketId>`
  - On `connection`: client sends `user_online` event with userId
  - On `disconnect`: broadcast `user_offline` to relevant rooms
  - New event: `get_online_users` → returns list of online userIds
- **Client changes:**
  - `apps/web/src/stores/useChatStore.ts` → Add `onlineUsers: Set<string>`
  - `apps/web/src/context/SocketContext.tsx` → Listen for `user_online`/`user_offline` events
  - `apps/web/src/pages/chat/Sidebar.tsx` → Show green dot on online users' avatars
  - `apps/web/src/pages/chat/ChatPage.tsx` → Show "Online" / "Last seen X ago" in header
- **Verify:** Open app in 2 browser tabs with different users. Both show each other as online. Close one tab → other shows offline

### 3.3 — Unread Message Badges
- **Client changes:**
  - `apps/web/src/stores/useChatStore.ts` → Add `unreadCounts: Record<string, number>`
  - When `receive_message` arrives for a conversation that is NOT active → increment unread count
  - When user clicks a conversation → reset its unread count to 0
  - `apps/web/src/pages/chat/Sidebar.tsx` → Render red badge with count on conversation items
- **Server changes (optional):**
  - Track read/unread in database (add `readAt` to ConversationMember or separate ReadReceipt model)
  - For now, client-side tracking is sufficient
- **Verify:** Receive message in non-active chat → badge appears. Click chat → badge clears

### 3.4 — Group Chat Creation UI
- **Files:**
  - `apps/web/src/components/NewChatModal.tsx` → Add "Create Group" tab
  - `apps/server/src/controllers/conversation.controller.ts` → Add group creation endpoint
- **Action:**
  - Add tabs to NewChatModal: "Direct Message" | "New Group"
  - Group tab: Multi-select users with checkboxes + group name input
  - Server: New endpoint `POST /api/app/group` → creates group conversation with multiple members
  - Group conversations show group name + member count in sidebar
  - Group avatar: Stacked avatars or initials icon
- **Prisma:** Schema already supports groups (`isGroup: Boolean`), no migration needed
- **Verify:** Create group with 3 members → appears in all members' sidebars → messages work

### 3.5 — Proper JWT Auth Middleware (Server)
- **Files:**
  - `apps/server/src/lib/authMiddleware.ts` (new file)
  - `apps/server/src/routes/app.routes.ts` → Apply middleware
  - `apps/server/src/routes/message.routes.ts` → Apply middleware
- **Action:**
  - Create middleware that:
    1. Reads `Authorization: Bearer <token>` header
    2. Verifies JWT with `jsonwebtoken`
    3. Attaches `req.userId` to the request
    4. Falls back to `x-user-id` header for backward compatibility
  - Apply to all `/api/app/*` and `/api/messages/*` routes
  - Remove `x-user-id` header usage from controllers (use `req.userId` instead)
- **Verify:** API calls work with JWT token. Remove `x-user-id` header from client → still works

### 3.6 — Search Functionality (Sidebar)
- **File:** `apps/web/src/pages/chat/Sidebar.tsx`
- **Action:** The search input exists but does nothing. Implement:
  - Filter conversations by name/username as user types
  - Debounce input (300ms)
  - Show "No results" state
  - Clear button (X) when search has text
- **Verify:** Type in search → conversations filter in real-time. Clear → all show again

### 3.7 — Improved Typing Indicator
- **File:** `apps/web/src/pages/chat/ChatPage.tsx`
- **Action:** Replace the plain text "X is typing..." with animated dots:
  - Three dots that bounce sequentially (CSS animation)
  - Show avatar of who's typing
  - Handle multiple typers: "Alice and Bob are typing..."
- **Verify:** When other user types → animated dots appear with their avatar

---

## Done When
- [ ] Dark mode toggle works and persists
- [ ] Online/offline status shows in real-time
- [ ] Unread badges appear on conversations with new messages
- [ ] Group chats can be created and used
- [ ] JWT middleware protects API routes
- [ ] Sidebar search filters conversations
- [ ] Typing indicator is animated
