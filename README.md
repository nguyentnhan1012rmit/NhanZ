# NhanZ Chat App

A professional, real-time chat application built with a modern monorepo architecture. Designed for performance, scalability, and code sharing between Web and Mobile.

## 🚀 Tech Stack

*   **Monorepo**: Turborepo + pnpm Workspaces
*   **Web**: React 19, Vite, Tailwind CSS v4, Shadcn/ui
*   **Server**: Node.js, Express, Socket.io, TypeScript
*   **Shared**: Zod Schemas, Types, Constants (ESM)
*   **Auth**: JWT (Stateless)
*   **Database**: PostgreSQL (Supabase) - *Pending integration*

## 📂 Project Structure

```bash
NhanZ/
├── apps/
│   ├── web/             # Frontend Application (React + Vite)
│   └── server/          # Backend API & Socket Server (Express)
├── packages/
│   └── shared/          # Shared logic (Types, Schemas) used by Web & Server
├── turbo.json           # Turborepo pipeline config
└── package.json         # Root scripts
```

## 🛠️ Getting Started

### Prerequisites

*   Node.js (v18+)
*   pnpm (`npm i -g pnpm`)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone <repo-url>
    cd NhanZ
    ```

2.  **Install dependencies**:
    ```bash
    pnpm install
    ```

### Running the App

Start both the Web and Server simultaneously:

```bash
pnpm dev
```

*   **Web**: http://localhost:5173
*   **Server**: http://localhost:4000

## 📜 Scripts

*   `pnpm dev`: Start development servers for all apps.
*   `pnpm build`: Build all apps and packages.
*   `pnpm lint`: Lint all code.

## 🌟 Features (Phase 1 & 2 Completed)

*   ✅ **Monorepo Architecture**: Shared types between FE and BE.
*   ✅ **Authentication System**:
    *   Shared Zod validation schemas.
    *   Login & Register UI (Shadcn/ui).
    *   Backend Auth API skeleton.
*   ✅ **Modern UI**: Tailwind v4 + Shadcn/ui components.

## 🔮 Upcoming

*   Real-time Messaging (Socket.io).
*   Supabase Database Integration.
*   Mobile App (React Native/Expo).
