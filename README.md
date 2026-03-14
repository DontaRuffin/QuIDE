# QuIDE — Quantum IDE

A browser-based Quantum Computing IDE built with Next.js, Qiskit Aer, and Supabase.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| State | Zustand |
| Circuit Engine | quantum-circuit.js |
| Code Editor | Monaco Editor |
| Charts | Recharts |
| Backend | FastAPI + Qiskit Aer (Python 3.11) |
| Auth / DB | Supabase (Postgres + RLS) |
| Deploy | Vercel (frontend) · Railway (Python service) |

---

## Project Structure

```
quide/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── ide/
│   │       └── page.tsx
│   ├── components/
│   │   ├── ide/
│   │   │   └── CircuitCanvas.tsx
│   │   ├── templates/
│   │   └── ui/
│   ├── hooks/
│   ├── lib/
│   │   ├── quantum/
│   │   ├── supabase/
│   │   └── api/
│   ├── stores/
│   │   └── circuitStore.ts
│   └── types/
│       └── circuit.ts
├── python/
│   ├── main.py
│   ├── routes/
│   │   └── simulate.py
│   ├── services/
│   │   └── qiskit_runner.py
│   └── requirements.txt
├── supabase/
│   └── migrations/
│       └── 001_initial.sql
├── SETUP.sh
└── .env.example
```

---

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/DontaRuffin/QuIDE.git
cd QuIDE
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
# Fill in your Supabase URL, anon key, and Python service URL
```

### 3. Run Frontend

```bash
npm run dev
# → http://localhost:3000
```

### 4. Run Python Service

```bash
cd python
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# → http://localhost:8000/health
```

### 5. Supabase Migrations

Paste the contents of `supabase/migrations/001_initial.sql` into your Supabase SQL Editor.

---

## Phase 1 Deliverables

- [x] Circuit type definitions (`types/circuit.ts`)
- [x] Zustand circuit store with QASM sync (`stores/circuitStore.ts`)
- [x] CircuitCanvas component — drag-drop + SVG render (`components/ide/CircuitCanvas.tsx`)
- [x] FastAPI simulation service (`python/main.py`)
- [x] Qiskit Aer runner with statevector + shot modes (`python/services/qiskit_runner.py`)
- [x] Simulate route with 30s timeout + thread pool (`python/routes/simulate.py`)
- [x] Supabase schema — profiles, circuits, simulation_results
- [x] Setup script (`SETUP.sh`)

---

## Deployment

**Frontend → Vercel**
```bash
npx vercel --prod
```
Add env vars in Vercel dashboard post-deploy.

**Python Service → Railway**
Push `python/` directory. Railway auto-detects FastAPI via `requirements.txt`.
Set `PORT=8000` and `SERVICE_API_KEY` in Railway environment variables.

---

## License

MIT
