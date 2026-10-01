# ⚡ NhanZ - Next-Generation Real-Time Messaging

> A stunning, high-performance, and feature-rich real-time chat application built with modern web technologies. 

NhanZ goes far beyond basic messaging. It is a full-fledged communication platform equipped with **End-to-End Encryption**, **WebRTC Video Calling**, an **AI Assistant**, and deeply customizable **Theme Workspaces**, all wrapped in a breathtaking glassmorphism UI.

---

## 📸 Screenshots

| Feature | Preview |
|---|---|
| **Sleek UI & Themes** | Beautiful, dynamic color palettes and backgrounds. |
| **WebRTC Video Calls** | Picture-in-Picture (PiP) immersive video calling. |
| **Command Palette** | Lightning-fast `Cmd+K` global search and actions. |
| **End-to-End Encryption** | AES-GCM secure messaging built into the client. |

---

## ✨ Key Features (The "WOW" Factor)

### 🤖 1. AI Chat Assistant Bot
Need a quick summary or a creative response? Mention the built-in **AI Bot** or use `/ai` slash commands directly in any conversation. The assistant seamlessly parses the context of your chat to generate helpful, context-aware responses instantly.

### 📹 2. WebRTC Video & Voice Calls
Experience crystal clear peer-to-peer communication! With just a click, launch into a secure video or voice call. The **Picture-in-Picture (PiP)** modal allows you to drag the video frame anywhere on your screen so you can keep chatting and browsing while on a call.

### 🔒 3. End-to-End Encryption (E2EE)
Privacy is a right, not a luxury. NhanZ employs the **Web Crypto API (AES-GCM)** to encrypt messages client-side before they ever touch the network. The server only sees and stores impenetrable ciphertext, which is seamlessly decrypted on the fly by the recipient. Look for the green 🔒 icon!

### 🎨 4. Theme Studio & Aesthetics
Your workspace, your rules.
- **Glassmorphism:** Frosted glass panels, subtle borders, and smooth gradients.
- **Micro-animations:** Framer Motion powers delightful, buttery smooth transitions.
- **Customization:** Choose between multiple vibrant Accent Colors (Blue, Purple, Rose, Amber, Green) and stunning Background Patterns (Dots, Grid, Waves) to tailor the experience to your exact taste.

### ⚡ 5. Power User Workflows
- **Global Command Palette (`Cmd+K`):** Instantly search for users, jump to settings, toggle themes, or navigate the app without taking your hands off the keyboard.
- **Right-Click Context Menus:** Effortlessly **Pin** important messages or **Translate** foreign languages with a single click.
- **Slash Commands:** Type `/` to bring up a dynamic menu of actions like `/shrug` or `/tableflip`.
- **Markdown & Code Snippets:** Full support for rich text rendering, code blocks, and syntax highlighting.

### 📱 6. Fully Responsive
Whether you are on a massive 4K monitor or an iPhone, NhanZ adapts flawlessly. The layout collapses into an intuitive mobile view with smooth slide-in sidebars and full-screen chat interfaces.

---

## 🛠️ Tech Stack

### Frontend (Client)
- **Framework:** React 19 + Vite
- **Routing:** React Router v7
- **Styling:** Tailwind CSS v4
- **State Management:** Zustand
- **Animations:** Framer Motion
- **UI Components:** Radix UI primitives
- **Icons:** Lucide React

### Backend (Server)
- **Environment:** Node.js + Express
- **Real-Time:** Socket.io (WebSockets)
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT + bcrypt
- **File Uploads:** Multer (Local Storage)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+)
- PostgreSQL database
- pnpm

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/NhanZ.git
   cd NhanZ
   ```

2. **Install dependencies (Monorepo):**
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables:**
   - Navigate to `apps/server` and duplicate `.env.example` to `.env`.
   - Update `DATABASE_URL` with your PostgreSQL credentials.
   - Set your `JWT_SECRET`.

4. **Initialize Database:**
   ```bash
   cd apps/server
   pnpm prisma migrate dev
   ```

5. **Run the Development Servers:**
   From the root of the project:
   ```bash
   pnpm dev
   ```
   - The Frontend will run on `http://localhost:5173`
   - The Backend API will run on `http://localhost:3000`

---

## 🏗️ Project Architecture

```
NhanZ/
├── apps/
│   ├── web/                # React Frontend application
│   │   ├── src/
│   │   │   ├── components/ # Reusable UI pieces & Modals
│   │   │   ├── context/    # Socket.io Context
│   │   │   ├── lib/        # Crypto, API bindings, Utils
│   │   │   ├── pages/      # Chat, Auth, Analytics routing
│   │   │   └── stores/     # Zustand state (Auth, Chat, Theme, Call)
│   └── server/             # Express Backend application
│       ├── prisma/         # Database schema & migrations
│       ├── src/
│       │   ├── routes/     # Express REST endpoints
│       │   ├── index.ts    # Server setup & Socket events
│       │   └── uploads/    # Local storage for attachments
├── packages/
│   └── shared/             # Shared TypeScript interfaces (if applicable)
└── docs/                   # Implementation plans & checklists
```

---
*Built with passion by the NhanZ Team.*
