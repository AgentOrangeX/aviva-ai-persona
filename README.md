# Discover Your Aviva AI Persona

A gamified web app that helps colleagues discover **how they bring AI to life** — and gives enablement leads a live, role-gated dashboard of where AI confidence sits across the organisation.

Answer 28 questions, get matched to one of **seven AI personas** (with a rare eighth-of-a-chance Catalyst), unlock achievements, and see a personalised learning journey. Registered users can save and track results; admins get aggregated cohort insights.

> **Note on content:** the persona copy, learning journeys and Aviva framing here are **illustrative demo content** for a working prototype. Review with brand/comms and L&D before any real rollout.

---

## What's inside

| Layer | Stack |
| --- | --- |
| Frontend | React 18 + Vite + React Router |
| Backend | Node.js + Express |
| Database | SQLite (`better-sqlite3`, with a built-in `node:sqlite` fallback) |
| Auth | Email + password (bcrypt) with JWT; role-based access (`user` / `admin`) |

### Key behaviours

- **Anonymous** visitors can take the quiz and see their result — but not save it.
- **Registered users** can save results and view their history.
- **Admins** can view the insights dashboard: persona distribution, an AI-maturity heatmap by business area, and a ranked list of high-potential change champions.
- **Scoring is server-authoritative.** Question weights never reach the browser, so results can't be gamed from the client.

---

## Quick start

You need **Node.js 18+** (Node 20 or 22 recommended).

```bash
# 1. clone
git clone <your-repo-url> aviva-ai-persona
cd aviva-ai-persona

# 2. install everything (root tooling + server + client)
npm run install:all

# 3. configure the backend
cp server/.env.example server/.env
#    then edit server/.env — at minimum set JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD

# 4. (optional) seed demo users so the admin dashboard has data
npm run seed

# 5. run both apps together
npm run dev
```

- Client: <http://localhost:5173>
- API: <http://localhost:4000>

The Vite dev server proxies `/api` to the backend, so there's no CORS fiddling in development.

### Logging in as admin

The first admin is created automatically from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `server/.env` when the server boots. Log in with those credentials and the **Admin** link appears in the nav.

### Demo accounts (after `npm run seed`)

Seeding creates ~70 demo colleagues across business areas so the dashboard looks alive. Any seeded account logs in with the password **`Password123`** (emails look like `priya.shah.0@example.aviva`).

---

## Project structure

```
aviva-ai-persona/
├─ server/                  Express API
│  ├─ src/
│  │  ├─ server.js          entry point (seeds admin, starts listening)
│  │  ├─ app.js             express app assembly (helmet, cors, rate limits)
│  │  ├─ routes/            auth, quiz, results, admin
│  │  ├─ middleware/auth.js JWT + role guards
│  │  ├─ lib/               scoring model, question bank, persona content, config
│  │  ├─ db/                schema + connection (dual-driver)
│  │  └─ seed.js            demo data
│  └─ test/api.test.js      integration tests (node --test)
│
├─ client/                  React + Vite SPA
│  └─ src/
│     ├─ main.jsx           routes + providers
│     ├─ pages/             intro, quiz, result, login, register, my-results, admin
│     ├─ components/        PersonaArt (SVGs), shared UI (TopBar, Toast, Confetti, guards)
│     └─ lib/               api client, auth context
│
└─ .github/workflows/ci.yml  build + test on push/PR
```

---

## API overview

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/quiz/questions` | public | Questions (no weights) |
| `POST` | `/api/results/score` | public | Score answers, **no save** |
| `POST` | `/api/auth/register` | public | Create account |
| `POST` | `/api/auth/login` | public | Log in |
| `GET` | `/api/auth/me` | user | Current profile |
| `POST` | `/api/results` | user | Score **and save** |
| `GET` | `/api/results/mine` | user | Saved history |
| `GET` | `/api/admin/overview` | admin | Headline stats |
| `GET` | `/api/admin/distribution` | admin | Persona spread |
| `GET` | `/api/admin/heatmap` | admin | Maturity by business area |
| `GET` | `/api/admin/champions` | admin | Ranked high-potential people |

---

## Testing

```bash
npm --prefix server test
```

Covers the full access model: anonymous scoring, the save gate, registration validation, and admin role enforcement.

---

## Deployment notes

- Set a strong `JWT_SECRET` (32+ chars) and `NODE_ENV=production`. The server refuses to start in production with a weak secret.
- Set `CLIENT_ORIGIN` to your deployed frontend origin(s), comma-separated.
- `better-sqlite3` ships prebuilt binaries and works on most hosts (including Railway). If a host can't load it, the app automatically falls back to Node's built-in `node:sqlite` (Node ≥ 22.5) — no config needed.
- SQLite is great for a single-instance internal tool. For multi-instance scale, swap the `db` layer for Postgres; routes use a small `prepare/get/all/run` surface that's straightforward to port.

## Roadmap / extension points

- **SSO**: auth is structured so Microsoft Entra / OAuth can be added alongside email+password.
- **Question authoring**: the bank in `server/src/lib/questions.js` is plain data — easy to edit or move into the DB.
- **Persona tuning**: lean vectors live in `server/src/lib/scoring.js`; the model is documented inline.

---

## Licence

MIT — see [LICENSE](./LICENSE).
