# Phase 5: WOW Features — Future Vision

> **Priority:** 🟢 Future  
> **Depends on:** Phase 3 + Phase 4  
> **Estimated time:** ~8-12 hours total  
> **Scope:** AI assistant, video/voice calls, theme studio, E2E encryption, analytics

---

## Goal
Transform NhanZ from a great chat app into an extraordinary one with features that make users say "WOW". These are differentiators that set NhanZ apart from basic chat implementations.

---

## Tasks

### 5.1 — 🤖 AI Chat Assistant Bot
- **Concept:** An AI-powered bot user that lives in any conversation and can:
  - Answer questions
  - Summarize conversations
  - Translate messages
  - Generate suggestions
- **Implementation:**
  - Create a system "AI Bot" user in the database (seeded)
  - Server-side: Intercept messages starting with `@AI` or `/ai`
  - Call OpenAI/Gemini API with conversation context
  - Bot sends response as a regular message (with special bot avatar/badge)
  - Rate limiting: Max 10 AI requests per user per hour
- **UI:**
  - Bot messages have a unique gradient bubble (different from user bubbles)
  - "AI" badge on bot avatar
  - Suggested prompts: `/ai summarize`, `/ai translate to [language]`, `/ai explain`
- **Verify:** Type `@AI what is the weather?` → Bot responds with AI-generated answer

### 5.2 — 📹 Video & Voice Calls (WebRTC)
- **Concept:** Peer-to-peer calling using WebRTC with Socket.io as signaling server
- **Implementation:**
  - **Signaling server:** Socket.io events for offer/answer/ICE candidate exchange
  - **Client:** WebRTC `RTCPeerConnection` API
  - **TURN/STUN:** Use free STUN servers (Google's) + optional TURN for NAT traversal
- **UI:**
  - Phone/Video buttons in chat header (already exist!) → Wire them up
  - Incoming call: Full-screen overlay with caller info + Accept/Decline
  - Active call: Floating video panel (picture-in-picture style)
  - Controls: Mute mic, toggle camera, share screen, end call
  - Call duration timer
- **Flow:**
  1. User A clicks Video → Socket sends `call_initiate` to User B
  2. User B sees incoming call overlay → Accepts
  3. WebRTC handshake via Socket.io signaling
  4. Peer-to-peer media stream established
  5. Either user can end → `call_ended` event
- **Verify:** Click video button → other user gets call → accept → video appears

### 5.3 — 🎨 Theme Studio
- **Concept:** Let users customize their chat appearance
- **Options:**
  - **Accent color picker:** Choose from 12 preset colors or custom hex
  - **Chat background:** Solid color, gradient, or pattern (subtle geometric/organic)
  - **Message bubble style:** Rounded, Sharp, Cloud
  - **Font size:** Small, Normal, Large
  - **Chat density:** Compact, Comfortable, Spacious
- **Implementation:**
  - Store preferences in localStorage (and optionally in user profile on server)
  - Apply as CSS custom properties on `:root`
  - Preview in real-time as user adjusts
- **UI:**
  - New "Appearance" section in Settings modal
  - Color grid with selection ring
  - Background pattern thumbnails
  - Live preview panel showing a sample chat
- **Verify:** Change accent to red → all buttons/bubbles turn red. Change background → chat background updates

### 5.4 — 🔐 End-to-End Encryption (E2EE)
- **Concept:** Client-side encryption so the server never sees plaintext messages
- **Implementation:**
  - Use Web Crypto API (`SubtleCrypto`)
  - Each user generates RSA key pair on registration (stored in IndexedDB)
  - When starting a conversation: Exchange public keys via server
  - Messages encrypted with recipient's public key before sending
  - Server stores ciphertext only
  - Recipient decrypts with their private key
  - Group chats: Use shared symmetric key, encrypted for each member
- **UI:**
  - 🔒 Lock icon in chat header for E2EE conversations
  - "Messages are end-to-end encrypted" banner
  - Key verification: QR code or safety number comparison
  - Option to enable/disable per conversation
- **Caveat:** This is complex. Consider using Signal Protocol library (`libsignal-protocol-javascript`)
- **Verify:** Inspect database → message content is encrypted ciphertext. Decrypt on client → readable

### 5.5 — 📊 Chat Analytics Dashboard
- **Concept:** Personal analytics about messaging habits
- **Metrics:**
  - Messages sent per day/week/month (line chart)
  - Most active hours (heatmap)
  - Top conversations by message count (bar chart)
  - Average response time
  - Emoji usage breakdown (pie chart)
  - Word cloud of most used words
- **Implementation:**
  - Server: Aggregate endpoints that query message data
  - Client: Chart library (Recharts or Chart.js)
  - New page: `/analytics` accessible from sidebar
- **UI:**
  - Dark-themed dashboard cards with gradient accents
  - Animated chart transitions
  - Date range selector
  - Export as image option
- **Verify:** Open analytics → see charts with real data from conversations

### 5.6 — 🔍 Global Search
- **Concept:** Search across all messages, users, and conversations
- **Implementation:**
  - Server: Full-text search endpoint using PostgreSQL `tsvector` or `ILIKE`
  - Client: Command palette (Cmd+K) with search input
  - Results grouped: Users | Conversations | Messages
  - Click result → Navigate to that conversation/message
- **UI:**
  - Cmd+K → Modal with search input
  - Results with highlighted matching text
  - Recent searches
  - Keyboard navigation (↑↓ to navigate, Enter to select)
- **Verify:** Press Cmd+K → Type "hello" → See all messages containing "hello" → Click → Navigate to that message

### 5.7 — 📌 Pinned Messages
- **Prisma:**
  ```prisma
  model Message {
    // ... existing
    isPinned Boolean @default(false)
    pinnedBy String?
    pinnedAt DateTime?
  }
  ```
- **Server:** `POST /api/messages/:messageId/pin` → Toggle pin
- **Client:**
  - Pin option in message context menu
  - Pinned messages icon in chat header → Opens pinned messages panel
  - Pinned messages panel: Slide-out from right
  - Click pinned message → Scroll to it in chat
- **Verify:** Pin a message → appears in pinned panel → click → scrolls to it

### 5.8 — 🌐 Message Translation
- **Concept:** One-click translation of any message
- **Implementation:**
  - Right-click message → "Translate" option
  - Call translation API (Google Translate / LibreTranslate)
  - Show translated text below original in smaller font
  - Auto-detect source language
- **Verify:** Receive message in Spanish → Click translate → English translation appears below

---

## Implementation Priority (within Phase 5)

| Priority | Feature | Impact | Effort |
|----------|---------|--------|--------|
| 1st | 5.6 Global Search | High | Medium |
| 2nd | 5.7 Pinned Messages | Medium | Low |
| 3rd | 5.3 Theme Studio | High | Medium |
| 4th | 5.1 AI Assistant | WOW | Medium |
| 5th | 5.8 Translation | Medium | Low |
| 6th | 5.5 Analytics | WOW | High |
| 7th | 5.2 Video Calls | WOW | Very High |
| 8th | 5.4 E2E Encryption | Expert | Very High |

---

## Done When
- [ ] At least 3 features from this phase are implemented
- [ ] Features integrate seamlessly with the existing dark theme
- [ ] No performance regression from added features
- [ ] All new features have proper loading states and error handling
