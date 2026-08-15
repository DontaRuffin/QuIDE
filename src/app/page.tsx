import Link from 'next/link';

const LESSON_STEPS = [
  {
    n: '01',
    title: 'Apply H to a single qubit',
    body: 'Drag a Hadamard (H) gate onto qubit 0 and run the circuit.',
    why: 'H puts your qubit into superposition — it’s now both 0 and 1 until measured. This is the building block of every quantum algorithm.',
    ai: '"Explain what just happened when H was applied to this qubit, in plain language, referencing the resulting state and probabilities shown in the simulator."',
  },
  {
    n: '02',
    title: 'Add a CNOT to build entanglement',
    body: 'Add a CNOT gate with qubit 0 as control and qubit 1 as target, then run again.',
    why: 'CNOT links the two qubits — measuring one now tells you the other’s value instantly. This is entanglement, the thing that makes quantum computers different from classical ones.',
    ai: '"Explain why the two qubits are now correlated, and what would happen if the student measured qubit 0 first."',
  },
  {
    n: '03',
    title: 'Measure and interpret results',
    body: 'Add measurement gates to both qubits and run the circuit 100+ times (shots).',
    why: 'You’ll see roughly 50% |00⟩ and 50% |11⟩ — never |01⟩ or |10⟩. That’s entanglement showing up in real data.',
    ai: '"Interpret this results histogram for a beginner — why only two outcomes appear, and what would break that pattern."',
  },
  {
    n: '04',
    title: 'From Local Simulation to Real QPUs',
    body: 'QuIDE simulates ideal statevectors locally in your browser. When you are ready for physical quantum computing, export your circuit to Qiskit Runtime to execute on IBM Quantum QPUs via your own cloud credentials.',
    why: 'Same circuit, real hardware. You’ll likely see some noise — a few unexpected outcomes. That’s real quantum hardware being imperfect, not a bug.',
    ai: '"Compare this hardware run to the simulator run and explain the differences in terms a beginner can understand — is this expected noise or a circuit design issue?"',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gh-canvas text-gh-text">
      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-gh-border bg-gh-canvas/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="font-semibold text-gh-blue">⬡ QuIDE</span>
          <Link
            href="/ide"
            className="rounded border border-gh-green bg-gh-green px-4 py-2 text-xs font-semibold text-gh-canvas hover:bg-opacity-90"
          >
            Launch the IDE →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="mx-auto max-w-4xl px-6 pb-16 pt-20 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gh-border bg-gh-surface px-4 py-1 text-xs text-gh-muted">
          Free · in-browser · no install
        </div>
        <h1 className="mb-6 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Learn quantum, visually,<br />
          <span className="text-gh-blue">in your browser.</span>
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-gh-muted">
          QuIDE is a quantum circuit IDE built for people who are curious, not credentialed. Drag gates
          onto qubits, run them instantly, and watch an AI assistant explain what&apos;s happening and why
          — no local install, no prior physics background required. Start with superposition and
          entanglement in under ten minutes.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/ide"
            className="rounded border border-gh-green bg-gh-green px-6 py-3 text-sm font-semibold text-gh-canvas hover:bg-opacity-90"
          >
            Build your first circuit →
          </Link>
          <a
            href="#lesson"
            className="rounded border border-gh-border px-6 py-3 text-sm font-semibold text-gh-muted hover:border-gh-blue hover:text-gh-text"
          >
            See the guided lesson
          </a>
        </div>
      </section>

      {/* AUDIENCE */}
      <section className="border-y border-gh-border bg-gh-surface">
        <div className="mx-auto grid max-w-5xl gap-10 px-6 py-16 sm:grid-cols-2">
          <div>
            <div className="mb-3 text-xs uppercase tracking-wider text-gh-blue">For self-learners</div>
            <p className="text-sm leading-relaxed text-gh-muted">
              Start with superposition and entanglement in under ten minutes. Drag gates onto qubits, run
              them instantly, and watch an AI assistant explain what&apos;s happening and why — no prior
              physics background required.
            </p>
          </div>
          <div>
            <div className="mb-3 text-xs uppercase tracking-wider text-gh-green">For teams</div>
            <p className="text-sm leading-relaxed text-gh-muted">
              If your team wants a working understanding of quantum computing — not just buzzwords —
              QuIDE is built for a live, hands-on session. Everyone builds a real circuit, runs it on a
              simulator or actual quantum hardware, and leaves with intuition they can explain to someone
              else.
            </p>
          </div>
        </div>
      </section>

      {/* GUIDED LESSON */}
      <section id="lesson" className="mx-auto max-w-4xl px-6 py-20">
        <div className="mb-12 text-center">
          <div className="mb-2 text-xs uppercase tracking-wider text-gh-blue">Guided lesson · 4 steps</div>
          <h2 className="text-2xl font-semibold sm:text-3xl">Your first quantum circuit</h2>
          <p className="mt-2 text-sm text-gh-muted">No math required. About ten minutes, start to finish.</p>
        </div>
        <div className="space-y-6">
          {LESSON_STEPS.map((step) => (
            <div key={step.n} className="rounded border border-gh-border bg-gh-surface p-6">
              <div className="mb-3 flex items-baseline gap-3">
                <span className="text-lg font-bold text-gh-blue">{step.n}</span>
                <h3 className="text-base font-semibold">{step.title}</h3>
              </div>
              <p className="mb-2 text-sm text-gh-text">{step.body}</p>
              <p className="mb-3 text-sm leading-relaxed text-gh-muted">{step.why}</p>
              <div className="rounded border border-gh-border bg-gh-canvas p-3 text-xs text-gh-muted">
                <span className="text-gh-green">AI &quot;Explain&quot; prompt:</span> {step.ai}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            href="/ide"
            className="inline-block rounded border border-gh-green bg-gh-green px-6 py-3 text-sm font-semibold text-gh-canvas hover:bg-opacity-90"
          >
            Try it yourself in the IDE →
          </Link>
        </div>
      </section>

      {/* WORKSHOP CTA BANNER */}
      <section className="border-y border-gh-blue bg-gh-surface">
        <div className="mx-auto max-w-3xl px-6 py-12 text-center">
          <h2 className="mb-3 text-xl font-semibold">
            Want a team workshop using QuIDE?{' '}
            <a href="https://www.dontaruffin.com/services" className="text-gh-blue underline">
              Book a quantum fundamentals session →
            </a>
          </h2>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-gh-muted">
            A half-day, hands-on session where your team builds and runs real quantum circuits in QuIDE
            — covering superposition, entanglement, and measurement — with time for your team&apos;s own
            questions about where quantum and AI are actually relevant to your work today versus hype.
            No prerequisites; runs in a browser.
          </p>
        </div>
      </section>

      {/* EMAIL CAPTURE */}
      <section className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h2 className="mb-3 text-xl font-semibold">Quantum in 10 Minutes</h2>
        <p className="mx-auto mb-8 max-w-lg text-sm leading-relaxed text-gh-muted">
          Get &quot;Quantum in 10 Minutes&quot; — 3 short emails, each with a hands-on circuit you build
          yourself. No fluff, no math you don&apos;t need.
        </p>
        <form
          action="https://formspree.io/f/xkoabkkz"
          method="POST"
          className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row"
        >
          <input type="hidden" name="_subject" value="QuIDE mini-course signup" />
          <input
            type="email"
            name="email"
            required
            placeholder="you@example.com"
            className="flex-1 rounded border border-gh-border bg-gh-canvas px-4 py-3 text-sm text-gh-text placeholder-gh-muted focus:border-gh-blue focus:outline-none"
          />
          <button
            type="submit"
            className="rounded border border-gh-green bg-gh-green px-6 py-3 text-sm font-semibold text-gh-canvas hover:bg-opacity-90"
          >
            Start the mini-course →
          </button>
        </form>
        <p className="mt-3 text-xs text-gh-muted">We respect your inbox. Unsubscribe at any time with one click.</p>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gh-border">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-xs text-gh-muted">
          <span>⬡ QuIDE — open source, built with Qiskit</span>
          <div className="flex gap-4">
            <Link href="/ide" className="hover:text-gh-text">Launch IDE</Link>
            <a href="https://github.com/DontaRuffin/QuIDE" className="hover:text-gh-text">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
