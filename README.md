# Yantri

Multi-tenant topic-choice engine — a simple REST API called by Daftar's workflow
canvas (HTTP Request node). Decides *what* to make; never makes or publishes it.
See [PLAN.md](PLAN.md) for the full build plan and `docs/handoff/` for the theory.

## Stack

- **TypeScript + Hono** (`@hono/node-server`) — one small service, no framework overhead
- **Prisma 7 + PostgreSQL 16** — three tables: Tenant, Choice, Outcome
- **Yarn** — package manager (not npm)
- Deploys to the ShowNoMore VPS under PM2, bound to localhost (Daftar calls it same-box)

## Quick start

```bash
yarn db:up          # boot local Postgres (Docker, port 5435)
cp .env.example .env   # fill ADMIN_API_KEY (openssl rand -hex 32)
yarn install
yarn db:migrate     # create schema
yarn dev            # http://127.0.0.1:3010
```

## Endpoints

| Endpoint | Auth | Purpose |
|---|---|---|
| `GET /health` | none | liveness + DB check |
| `POST /v08.2026/tenants` | admin | register a brand; returns its API key once |
| `GET /v08.2026/tenants/me` | tenant | identity + brand context (auth smoke test) |
| `PATCH /v08.2026/tenants/me` | tenant | update own brand context |
| `POST /v08.2026/score` | tenant | score ONE topic → compact verdict (needs `GEMINI_API_KEY`) |
| `POST /v08.2026/choose` | tenant | score a batch of candidates → ranked top N |
| `GET /v08.2026/choices/:id` | tenant | full auditable reasoning + outcomes for a choice |
| `POST /v08.2026/outcome` | tenant | report published metrics; computes outlier vs own baseline |
| `GET /v08.2026/tenants/me/baseline` | tenant | trailing per-platform baseline (last 20 outcomes) |

Compact responses by design — Daftar's HTTP node truncates bodies at 2000 chars;
full detail always lives behind `GET /choices/:id`. See PLAN.md for the contract.

## Scripts

| Command | What it does |
|---|---|
| `yarn dev` | tsx watch mode on port 3010 |
| `yarn build` | prisma generate + tsc → `dist/` |
| `yarn start` | run built server |
| `yarn typecheck` | tsc --noEmit |
| `yarn db:up` / `db:down` | local Postgres via docker compose |
| `yarn db:migrate` | prisma migrate dev |
| `yarn db:deploy` | prisma migrate deploy (production) |
