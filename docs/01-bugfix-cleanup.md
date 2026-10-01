# Phase 1: Bugfix & Cleanup

> **Priority:** 🔴 Critical — Must complete before any other phase  
> **Estimated time:** ~30 minutes  
> **Files affected:** 8 files

---

## Goal
Fix all 10 identified bugs, remove dead code, and clean up boilerplate so the app has a solid foundation for the visual overhaul.

## Tasks

### 1.1 — Fix duplicate sort in useChatStore
- **File:** `apps/web/src/stores/useChatStore.ts` (line 122)
- **Action:** Remove the duplicate `updatedConversations.sort(...)` call — exact same sort is called on lines 120 AND 122
- **Verify:** Only one `.sort()` remains in `updateConversationLastMessage`

### 1.2 — Fix stale closure in ChatPage socket handler
- **File:** `apps/web/src/pages/chat/ChatPage.tsx` (lines 85-126)
- **Action:** Use a `useRef` to track `activeConversationId` so the socket `receive_message` handler always references the latest value instead of a stale closure capture
- **Verify:** Switch conversations rapidly while receiving messages — no messages appear in wrong chat

### 1.3 — Fix dead code in receive_message handler
- **File:** `apps/web/src/pages/chat/ChatPage.tsx` (lines 88-96)
- **Action:** The `if` block on lines 93-96 is empty (has comments but no logic). The actual message append on line 108-110 uses `currentConvId` but the check above it is dead. Consolidate into one clean check:
  ```typescript
  if (data.conversationId === activeConvRef.current) {
      setMessages((prev) => [...prev, data]);
  }
  ```
- **Verify:** Messages from other users appear correctly in the active conversation

### 1.4 — Remove stale Vite boilerplate in App.css
- **File:** `apps/web/src/App.css`
- **Action:** Delete the entire file content (or the file itself). The `#root { max-width: 1280px; padding: 2rem }` constrains the chat layout and the `.logo`, `.card`, `.read-the-docs` classes are unused Vite scaffold remnants
- **Verify:** Chat layout fills full viewport width without padding

### 1.5 — Fix index.html title and meta
- **File:** `apps/web/index.html`
- **Action:** Change `<title>web</title>` to `<title>NhanZ — Chat</title>`. Add meta description. Add proper favicon reference
- **Verify:** Browser tab shows "NhanZ — Chat"

### 1.6 — Add auth token to API interceptor
- **File:** `apps/web/src/lib/api.ts`
- **Action:** Add a request interceptor that attaches the JWT token from localStorage as `Authorization: Bearer <token>` header on every request. This replaces the `x-user-id` hack pattern
  ```typescript
  api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
          config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
  });
  ```
- **Note:** Server-side middleware to verify the JWT and extract userId is a Phase 3 task. For now, the `x-user-id` header will continue to work alongside this
- **Verify:** Network tab shows `Authorization` header on API requests

### 1.7 — Fix Vite env check in SocketContext
- **File:** `apps/web/src/context/SocketContext.tsx` (line 39)
- **Action:** Replace `process.env.NODE_ENV` with `import.meta.env.MODE` (Vite doesn't expose `process.env`)
  ```typescript
  // Before
  if (process.env.NODE_ENV === "production") {
  // After  
  if (import.meta.env.MODE === "production") {
  ```
- **Verify:** No console warning about `process.env` being undefined

### 1.8 — Clean up comment block in Sidebar
- **File:** `apps/web/src/pages/chat/Sidebar.tsx` (lines 146-156)
- **Action:** Remove the 10-line dev comment block. These are implementation notes that shouldn't ship
- **Verify:** No comment block between ScrollArea close and modal renders

### 1.9 — Deduplicate IIFE in ChatPage header
- **File:** `apps/web/src/pages/chat/ChatPage.tsx` (lines 172-209)
- **Action:** The chat header has TWO separate IIFEs that compute identical values (`conv`, `other`, `name`, `username`, `avatar`). Extract into a single `useMemo` or computed variable at the top of the return block
  ```typescript
  const activeConv = conversations.find(c => c.id === activeConversationId);
  const otherUser = activeConv?.members?.find((m: any) => m.user.username !== user?.username)?.user;
  const chatName = activeConv?.isGroup ? activeConv.name : otherUser?.name || otherUser?.username || "Unknown";
  const chatUsername = activeConv?.isGroup ? "" : otherUser?.username;
  const chatAvatar = activeConv?.isGroup ? null : otherUser?.avatar;
  ```
- **Verify:** Header renders same info with no duplicate computation

### 1.10 — Remove dead checkAuth function
- **File:** `apps/web/src/stores/useAuthStore.ts` (lines 32-45)
- **Action:** The `checkAuth` function body is empty (just reads token, does nothing). Either implement it properly (make a `/api/auth/me` call) or remove the dead code. For now, add a TODO and simplify:
  ```typescript
  checkAuth: async () => {
      // TODO: Implement /api/auth/me endpoint to validate token
      const token = localStorage.getItem('token');
      if (!token) {
          set({ user: null, token: null, isAuthenticated: false });
      }
  },
  ```
- **Verify:** Function at least clears state when no token exists

---

## Done When
- [ ] All 10 tasks checked off above
- [ ] `pnpm dev` runs without console errors
- [ ] Chat layout fills full viewport (no padding/max-width constraint)
- [ ] Browser tab shows "NhanZ — Chat"
- [ ] No dead code or boilerplate remains
