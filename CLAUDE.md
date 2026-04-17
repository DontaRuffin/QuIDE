# QuIDE — Claude Code Context

> This file gives Claude Code full project context for working on QuIDE.
> Read this before making any changes.

---

## What is QuIDE

QuIDE (Quantum Integrated Development Environment) is a browser-based quantum IDE targeting the prosumer gap between IBM's free Qiskit tutorials and enterprise tools like Classiq ($30K/seat). Built solo by Donta' Ruffin.

**Live URLs:**
- Frontend: https://qu-ide.vercel.app
- Simulation backend: https://quide-production.up.railway.app
- GitHub: https://github.com/DontaRuffin/QuIDE

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Zustand |
| Circuit Visualization | quantum-circuit.js |
| Simulation Backend | FastAPI, Qiskit 1.2.4, Qiskit Aer 0.15.1 |
| Database + Auth | Supabase (PostgreSQL + RLS) |
| Frontend Hosting | Vercel |
| Backend Hosting | Railway |
| AI Layer (Phase 2) | Anthropic API (Claude Haiku 4.5), BYOK |

---

## Project Structure

```
~/Documents/QuIDE/
├── src/
│   ├── app/
│   │   └── page.tsx          # Main IDE layout — three-panel UI
│   ├── components/
│   │   └── ide/
│   │       └── CircuitCanvas.tsx  # quantum-circuit.js wrapper
│   ├── stores/
│   │   └── circuitStore.ts   # Zustand store — circuit state, simulation results
│   └── types/
│       └── quantum-circuit.d.ts   # Type declaration for quantum-circuit.js
├── python/                   # FastAPI simulation backend (deployed to Railway)
│   ├── main.py               # FastAPI entry point
│   ├── routes/
│   │   └── simulate.py       # /simulate endpoint
│   ├── requirements.txt
│   ├── Procfile              # web: uvicorn main:app --host 0.0.0.0 --port $PORT
│   └── runtime.txt           # python-3.11
├── .env.local                # NEXT_PUBLIC_SIMULATION_URL, Supabase keys
└── CLAUDE.md                 # This file
```

---

## Phase 1 — Complete ✅

Everything below is shipped and working:

- Three-panel IDE layout: gate toolbar (left), circuit canvas (center), Qiskit code panel (right)
- Drag-and-drop gate builder with bidirectional QASM sync via Zustand
- FastAPI simulation backend running Qiskit Aer (deployed on Railway)
- Simulation results panel below canvas
- Supabase auth + row-level security
- Vercel frontend deployment
- Railway backend deployment at `quide-production.up.railway.app`

**Known working flow:** Drag H gate → Qiskit code updates → hit Simulate → results return from Railway backend in ~150-200ms.

---

## Phase 2 — Current Work

Phase 2 adds the AI layer. Build in this exact order:

### Priority 1: IBM BYOK Hardware Routing (rebuild required)

IBM Quantum Platform Classic was sunset July 1, 2025. The new platform is at `quantum.cloud.ibm.com`.

**What changed:**
- New base URL: `quantum.cloud.ibm.com/api/v1/`
- Authentication: IBM Cloud IAM — users paste a 44-character API key, backend exchanges it for a short-lived (<1 hour) IAM bearer token via `iam.cloud.ibm.com/identity/token`
- Every request now requires an **Instance CRN** header alongside the bearer token
- IBM supports `us-east` and `eu-de` regions
- Only **ISA-transpiled circuits** are accepted (required since March 2024)
- Only **V2 primitives** (SamplerV2, EstimatorV2) — V1 retired August 2024
- IBM does not advertise CORS headers — a proxy layer is required
- IBM has no OAuth-for-apps flow — BYOK is the only permitted pattern
- Qiskit Runtime is geo-blocked in ~30 countries — must warn users

**New hardware available on free Open Plan:**
- `ibm_kingston` (Heron r2) is accessible on free tier
- `ibm_nighthawk` (120 qubits) available on Premium/Flex

**IBM pricing to surface in UI:**
- Pay-As-You-Go: ~$96/minute of QPU time
- Flex Plan: $30K minimum
- Always show IBM hardware cost separately from QuIDE subscription cost

**References:**
- New API docs: `quantum.cloud.ibm.com/docs/en/api/qiskit-runtime-rest`
- Migration guide: `quantum.cloud.ibm.com/docs/en/migration-guides/classic-iqp-to-cloud-iqp`
- Untrusted environment guide: `quantum.cloud.ibm.com/docs/en/guides/cloud-setup-untrusted`

---

### Priority 2: "Explain this circuit" (visual-first AI)

**This is the flagship Phase 2 feature and QuIDE's primary moat.**

The key differentiator: QuIDE's AI explains the **visual circuit canvas**, not just the generated Qiskit code text. Microsoft Copilot and IBM's Qiskit Code Assistant both explain code strings. QuIDE explains what the circuit *does* gate by gate — state evolution, entanglement, what the user would observe when measured.

**Implementation:**
- Model: Claude Haiku 4.5 via Anthropic API (`claude-haiku-4-5`)
- BYOK: User provides their own Anthropic API key (stored in localStorage, never sent to server)
- Trigger: "Explain" button in header (on-demand, not auto)
- UI placement: Toggle in the Qiskit Code panel — switch between "Code" view and "Explain" view
- Input to AI: Current QASM string from Zustand store + number of qubits
- Output: Plain English explanation, gate by gate, with state evolution notes
- Streaming preferred for better UX

**System prompt direction:**
```
You are a quantum computing educator. Given a QASM circuit, explain what it does 
in plain English — gate by gate, describing the quantum state after each operation. 
Assume the reader is a software developer who knows classical programming but is 
new to quantum computing. Be clear, concise, and avoid unnecessary jargon.
```

**API call pattern (frontend, using user's BYOK key):**
```typescript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': userApiKey,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    messages: [{ role: 'user', content: `Explain this quantum circuit:\n\n${qasm}` }],
    system: EXPLAIN_SYSTEM_PROMPT,
  }),
});
```

---

### Priority 3: "Debug my circuit" (hardware-aware warnings)

Co-flagship with Explain. No browser tool currently does this.

**Features:**
- Coupling map validation against selected IBM backend
- SWAP insertion preview (warn when circuit requires SWAPs that degrade fidelity)
- T1/T2-relative circuit depth alerts (warn when circuit depth approaches decoherence time)
- Readout error forecast for the selected backend
- Shot/cost estimator: given N shots on Pay-As-You-Go, estimate cost in dollars

**Implementation note:** This can be partly rule-based (no AI needed for coupling-map checks) and partly AI-assisted (natural language debug summary). Build the rule-based checks first.

---

### Priority 4: Pricing + Billing (Stripe)

Stripe is already integrated in Solon AI — reuse that pattern.

**Tiers:**
- Free: simulation, 5 saved circuits, 50 AI requests/month
- Developer ($20/mo): unlimited circuits, 500 AI requests/month, IBM hardware routing
- Researcher ($129/mo): 2,000 AI requests/month, priority queue, larger qubit limits
- Academic site license: contact sales
- Free for verified .edu email addresses

**Important:** Publish usage quotas from day one even if billing is flat-rate. This gives infrastructure to meter when needed.

---

## Environment Variables

```bash
# .env.local (frontend)
NEXT_PUBLIC_SIMULATION_URL=https://quide-production.up.railway.app
NEXT_PUBLIC_SUPABASE_URL=<supabase project url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase anon key>

# Railway (backend)
SIMULATION_SERVICE_KEY=dev-key-change-in-prod
PORT=8000
```

**Note:** Anthropic API key for "Explain" feature is BYOK — stored in user's localStorage, passed client-side directly to Anthropic API. Never stored server-side.

---

## Key Architecture Decisions

**Bidirectional QASM sync:** The circuit canvas and Qiskit code panel stay in sync via Zustand. The `updateSource` flag and `lastEmittedQasm` ref prevent infinite loops — do not remove these.

**Simulation API key:** The Railway backend requires `X-Service-Key: dev-key-change-in-prod` header on all requests. This is intentionally weak for dev — change before any paid user onboarding.

**quantum-circuit.js SVG theming:** Gate label rendering uses injected CSS (`DARK_THEME_CSS` in `CircuitCanvas.tsx`). Do not remove or significantly alter this or gate labels go blank.

**venv location:** The working Python venv is at `~/Documents/QuIDE/python/venv`. The root-level `venv/` is broken (corrupted pydantic_core) and should be ignored. Always activate `python/venv` when running the backend locally.

**Local dev commands:**
```bash
# Terminal 1 — frontend
cd ~/Documents/QuIDE && npm run dev

# Terminal 2 — backend
cd ~/Documents/QuIDE/python && source venv/bin/activate && uvicorn main:app --reload --port 8000
```

---

## Hardware Constraints

Development machine is a 2017 MacBook Pro running macOS Catalina. This imposes:
- Qiskit pinned to 1.2.4 (newer versions incompatible)
- Qiskit Aer pinned to 0.15.1
- Python 3.11 via Homebrew (not system Python)
- No Docker (avoid unless absolutely necessary)

---

## Competitive Context

| Tool | Tier | Gap QuIDE fills |
|------|------|----------------|
| IBM Quantum (free) | Free | No visual canvas + AI; Lab retired |
| Microsoft Copilot in Quantum | Free | Q#-first, not Qiskit-first; explains code not circuit |
| qBraid | Freemium | Jupyter-based, not visual-first |
| Classiq | $30K/seat | Enterprise only |
| Quantum Elements Constellation | Research | Fault-tolerant teams, not learners |

QuIDE's moat: **visual-circuit-aware AI** + **Qiskit-first** + **prosumer pricing** + **browser-native with no environment setup**.

---

## What NOT to do

- Do not upgrade Next.js to v16 — breaking change, avoid `npm audit fix --force`
- Do not commit the `venv/` folder — it's in `.gitignore` now
- Do not store user API keys server-side
- Do not add IBM OAuth — it doesn't exist, BYOK is the only permitted pattern
- Do not add features outside Phase 2 scope without checking this file first
- Do not run simulations on the old IBM Classic API endpoints — they are dead

---

## Git Notes

Branch protection is set to warn on unsigned commits and direct pushes to main. These warnings are bypassed but logged. For now, committing directly to main is fine. Set up signed commits before any public user onboarding.
