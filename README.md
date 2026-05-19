# thangam-frontend

React web admin dashboard for **Sri Thangam Housing** — manages properties, bookings, billing, members, and branch operations.

## Tech Stack

- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS v4
- **State / Data:** TanStack Query v5 + Zustand v5
- **Forms:** React Hook Form v7 + Zod v4
- **Routing:** React Router v7
- **HTTP:** Axios
- **Realtime:** Socket.IO client
- **Deployment:** Render (static site)

## Prerequisites

- Node.js 20+
- Backend API running (see `thangam-backend`)

## Quick Start

```bash
npm install
cp .env.example .env      # set VITE_API_URL
npm run dev               # http://localhost:3000
```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL (e.g. `http://localhost:3001`) |

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:watch` | Watch mode tests |

## Deployment

Deployed on **Render** as a static site via `render.yaml`. CI/CD runs on GitHub Actions:
1. Type-check → Lint → Tests → Build
2. On `main` push: triggers Render deploy webhook

Required GitHub Secrets: `VITE_API_URL`, `RENDER_DEPLOY_HOOK_FRONTEND`.
