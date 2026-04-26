# Aura — AI Mental Wellness Platform (Frontend)

> A calm, intelligent companion for mood tracking, journaling, wellness planning, and AI-powered therapy.

**Live:** [aura-gdg.netlify.app](https://aura-gdg.netlify.app) &nbsp;·&nbsp; **Backend:** [Aura_bd](https://github.com/Bharath-tars/Aura_bd)

![React](https://img.shields.io/badge/React_18-20232A?style=flat&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![Netlify](https://img.shields.io/badge/Deployed_on-Netlify-00C7B7?style=flat&logo=netlify&logoColor=white)

---

## Features

| Page | What it does |
|---|---|
| **Dashboard** | Streak, mood snapshot, recent journal entries, active wellness plans |
| **AI Coach** | Streaming chat with CBT/mindfulness-trained AI, multi-session history, auto-named sessions |
| **AI Therapist** | Calming companion with semantic memory, platform-wide context, multi-session support |
| **Mood Tracker** | Log mood 1–10, emotions, factors, notes — edit/delete entries, weekly trend chart |
| **Journal** | Rich entries with AI sentiment & theme analysis; create, view, delete |
| **Wellness Plans** | AI-generated plans with tasks, time logging, and progress tracking |
| **Mood Analytics** | Cross-platform metrics — mood trends, journal stats, task completion, wellness progress |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Server state | TanStack Query v5 |
| Client state | Zustand |
| Charts | Recharts |
| Animation | Framer Motion |
| Routing | React Router v6 |
| HTTP / Streaming | Axios + native `fetch` SSE for AI responses |

---

## Getting Started

```bash
npm install

# Point to the backend
echo "VITE_API_URL=https://aurabd-production.up.railway.app" > .env

npm run dev        # → http://localhost:5173
npm run build      # Production build
```

**Demo credentials**
```
Email:    demo@aura.app
Password: aura2025
```

---

## Project Structure

```
src/
├── api/            # Axios wrappers per backend resource
├── components/
│   ├── chat/       # ChatWindow, ChatInput, MessageBubble
│   ├── layout/     # AppShell, Sidebar
│   ├── mood/       # MoodLogForm, MoodChart
│   └── ui/         # Shared primitives
├── pages/          # One file per route
├── store/          # Zustand slices (auth, UI)
├── types/          # Shared TypeScript interfaces
└── lib/            # Utils — cn(), getMoodColor(), getMoodLabel()
```

---

## Deployment

Hosted on **Netlify** — every push to `main` triggers an automatic build and deploy.

---

## Developer

Built by [Sudarsanam Bharath](https://www.linkedin.com/in/bharath-sudarsanam/)
