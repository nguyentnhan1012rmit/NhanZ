# Phase 4: Messaging Upgrades

> **Priority:** 🟡 High  
> **Depends on:** Phase 2 (Visual Overhaul)  
> **Can run in parallel with:** Phase 3  
> **Estimated time:** ~3 hours  
> **Scope:** Message reactions, edit/delete, image/file sharing, read receipts, voice messages

---

## Goal
Elevate the messaging experience from basic text-only chat to a rich communication platform with reactions, media sharing, and message management.

## Tasks

### 4.1 — Message Reactions (Emoji)
- **Prisma schema update:**
  ```prisma
  model Reaction {
    id        String   @id @default(uuid())
    emoji     String   // "👍", "❤️", "😂", "🔥", "😢", "👏"
    userId    String
    messageId String
    user      User     @relation(fields: [userId], references: [id])
    message   Message  @relation(fields: [messageId], references: [id])
    createdAt DateTime @default(now())
    @@unique([userId, messageId, emoji])
  }
  ```
- **Server:**
  - `POST /api/messages/:messageId/react` → Add/toggle reaction
  - `GET /api/messages/:conversationId` → Include reactions in message response
  - Socket event: `message_reaction` → Broadcast to room
- **Client:**
  - Hover/long-press on message → Show reaction picker (6 common emojis)
  - Display reactions below message bubble as small pills with count
  - Click existing reaction → Toggle (add/remove your reaction)
  - Real-time update via socket
- **Verify:** React to a message → emoji appears below it. Other user sees it in real-time

### 4.2 — Edit & Delete Messages
- **Prisma schema update:**
  ```prisma
  model Message {
    // ... existing fields
    editedAt   DateTime?
    deletedAt  DateTime?  // Soft delete
  }
  ```
- **Server:**
  - `PUT /api/messages/:messageId` → Edit message (only sender can edit)
  - `DELETE /api/messages/:messageId` → Soft delete (set `deletedAt`)
  - Socket events: `message_edited`, `message_deleted`
- **Client:**
  - Right-click or "..." menu on own messages → Edit / Delete options
  - Edit: Inline edit mode with save/cancel
  - Delete: Confirmation dialog → Message replaced with "This message was deleted" (italic, muted)
  - Edited messages show "(edited)" label
  - Real-time updates via socket
- **Verify:** Edit a message → text updates everywhere. Delete → shows "deleted" placeholder

### 4.3 — Image & File Sharing in Chat
- **Server:**
  - Extend upload controller to handle message attachments (not just avatars)
  - `POST /api/messages/upload` → Upload to Cloudinary, return URL
  - Store attachment URL in message content or new `attachments` field
- **Prisma (optional extension):**
  ```prisma
  model Message {
    // ... existing fields
    attachmentUrl  String?
    attachmentType String?  // "image", "file", "video"
  }
  ```
- **Client:**
  - Attachment button (📎) in chat input → File picker
  - Image preview before sending (thumbnail)
  - In chat: Images render inline with lightbox on click
  - Files: Show file name + download icon
  - Drag & drop support on chat area
  - Upload progress indicator
- **Verify:** Send an image → appears inline. Click → lightbox opens. Send a PDF → shows download link

### 4.4 — Read Receipts
- **Prisma schema update:**
  ```prisma
  model ReadReceipt {
    id             String       @id @default(uuid())
    userId         String
    conversationId String
    lastReadAt     DateTime     @default(now())
    user           User         @relation(fields: [userId], references: [id])
    conversation   Conversation @relation(fields: [conversationId], references: [id])
    @@unique([userId, conversationId])
  }
  ```
- **Server:**
  - `POST /api/messages/:conversationId/read` → Update read receipt timestamp
  - Socket event: `messages_read` → Broadcast to room
- **Client:**
  - When user opens a conversation → Send read receipt
  - Own messages show checkmarks:
    - ✓ = Sent
    - ✓✓ = Delivered (received by server)
    - ✓✓ (blue) = Read by recipient
  - Privacy modal toggle: Already exists (`Read Receipts` switch) — wire it up
- **Verify:** Send message → single check. Other user opens chat → double blue check appears

### 4.5 — Voice Messages
- **Client:**
  - Microphone button next to send (replaces send when input is empty)
  - Hold to record → Show recording timer + waveform visualization
  - Release → Upload audio to Cloudinary → Send as message with `attachmentType: "audio"`
  - Playback: Custom audio player with waveform, play/pause, speed control
  - Use Browser `MediaRecorder` API
- **Server:**
  - Reuse Cloudinary upload endpoint
  - Store as attachment on message
- **Verify:** Hold mic button → record → release → audio message appears with playable waveform

### 4.6 — Reply to Messages
- **Client:**
  - Swipe right on a message (or click reply icon) → Shows reply preview above input
  - Reply preview: Small card showing original message text + sender name
  - Sent reply: Shows quoted message above the actual reply bubble
  - Click on quoted section → Scroll to original message
- **Server:**
  - Add `replyToId String?` and `replyTo Message? @relation(...)` to Message model
  - Include `replyTo` in message fetch queries
- **Verify:** Reply to a message → shows quoted preview. Click quote → scrolls to original

### 4.7 — Message Context Menu
- **File:** `apps/web/src/pages/chat/ChatPage.tsx`
- **Action:** Right-click on any message → Context menu with:
  - 📋 Copy text
  - ↩️ Reply (triggers 4.6)
  - 😊 React (triggers 4.1)
  - ✏️ Edit (own messages only, triggers 4.2)
  - 🗑️ Delete (own messages only, triggers 4.2)
  - 📌 Pin (triggers Phase 3 if added)
- Use Radix `DropdownMenu` or `ContextMenu` component
- **Verify:** Right-click message → context menu appears with appropriate options

---

## Database Migration Required
This phase requires a Prisma migration:
```bash
cd apps/server
npx prisma migrate dev --name messaging-upgrades
```

## Done When
- [ ] Can react to messages with 6 emoji options
- [ ] Can edit own messages (shows "edited" label)
- [ ] Can delete own messages (soft delete)
- [ ] Can send images (inline preview + lightbox)
- [ ] Can send files (download link)
- [ ] Read receipts show ✓ / ✓✓ / ✓✓(blue)
- [ ] Can record and send voice messages
- [ ] Can reply to specific messages with quote
- [ ] Right-click context menu works on messages
