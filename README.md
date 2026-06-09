# Wandel Dashboard

Internal recruitment dashboard for Wandel — browse and review AI-screened candidates, manage
client positions and their candidate pipelines, and present client-facing position/profile views.

Built with **React 19 + TypeScript + Vite**, styled with **Tailwind CSS v4**, routed with
**React Router v7**. Data is currently mocked in-memory (`src/data/mockData.ts`); there is no backend.

## Getting started

```bash
npm install      # install dependencies
npm run dev      # start the dev server (Vite) with HMR
npm run build    # type-check (tsc -b) and produce a production build in dist/
npm run preview  # serve the production build locally
npm run lint     # run ESLint
```

Requires a recent Node.js (18+). Open the dev server URL printed by `npm run dev`.

## Folder structure

The codebase is organized **by feature**. Each feature folder owns its pages and feature-specific
components; cross-cutting code lives in shared top-level folders.

```
src/
├── candidates/        Candidates feature
│   ├── AiCandidates.tsx       — candidate list table (route: /candidates, /ai-candidates)
│   └── CandidateDetail.tsx    — single candidate detail view (route: /candidates/:id)
├── positions/         Positions feature (recruiter + client-facing)
│   ├── Positions.tsx          — positions list (route: /positions)
│   ├── PositionDetail.tsx     — position detail: Matched Candidates + Job Description tabs
│   ├── PositionWorkspace.tsx  — client workspace (route: /clients/positions)
│   ├── PositionCandidateDetail.tsx
│   ├── NewPosition.tsx        — new-position creation flow
│   ├── ClientPositions.tsx
│   └── components/profile/    — client-facing candidate profile views (used by PositionCandidateDetail)
├── clients/           Clients feature
│   └── Employers.tsx          — clients list table (route: /employers)
├── dashboard/         Dashboard.tsx (route: /dashboard)
├── sophia/            AskSophia.tsx (route: /ask-sophia)
├── components/        Shared UI used across features
│                      (Sidebar, StatusBadge, PipelineStatusBadge, NeedForActionBadge,
│                       ChannelBadge, SophiaChrome)
├── hooks/             Shared React hooks (useTypewriter)
├── types/             Central domain types (index.ts) — Candidate, Position, statuses, etc.
├── constants/         App-wide constants (theme.ts: card gradients)
├── lib/               Utilities & in-memory stores (positionsStore.ts)
├── data/              Mock data (mockData.ts)
├── assets/            Images
├── App.tsx            Route table (maps URLs → feature pages) + sidebar layout
└── main.tsx           App entry point
```

## Where to find key features

| Feature | Entry point | Route(s) |
| --- | --- | --- |
| Candidate list | `candidates/AiCandidates.tsx` | `/candidates`, `/ai-candidates` |
| Candidate detail (contact history, calls, verdict) | `candidates/CandidateDetail.tsx` | `/candidates/:id` |
| Positions list | `positions/Positions.tsx` | `/positions` |
| Position detail (matched candidates, job description) | `positions/PositionDetail.tsx` | `/positions/:id` |
| Client positions workspace | `positions/PositionWorkspace.tsx` | `/clients/positions` |
| New position flow | `positions/NewPosition.tsx` | `/clients/new-position` |
| Clients list | `clients/Employers.tsx` | `/employers` |
| Dashboard | `dashboard/Dashboard.tsx` | `/dashboard` |
| Ask Sophia | `sophia/AskSophia.tsx` | `/ask-sophia` |
| Left navigation | `components/Sidebar.tsx` | (all routes) |

All routes are declared in `src/App.tsx`.

## Conventions

- **Feature-first folders.** New screens belong in their feature folder; components used by a
  single feature live in that feature's `components/`. Promote to top-level `components/` only
  when shared across features.
- **Types** for domain entities live in `src/types`. One-off component prop interfaces stay
  next to their component.
- **Shared constants** (theme/gradients, etc.) live in `src/constants`; reusable utilities and
  in-memory stores in `src/lib`; mock data in `src/data`.
- **Status → label/colour maps** live with their badge components (`PipelineStatusBadge`,
  `NeedForActionBadge`) or in the feature/constants that own them.
- Tailwind utility classes are used directly in JSX; there is no separate CSS module per component.

## Notes

- Data is mock-only and resets on reload (e.g. positions added via the New Position flow are kept
  in `lib/positionsStore.ts` for the current session only).
- `npm run build` runs `tsc -b` first; keep the type-check clean.
