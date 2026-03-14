import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <div className="text-6xl mb-6">⬡</div>
        <h1 className="text-4xl font-semibold mb-4 text-gh-text">
          QuIDE
        </h1>
        <p className="text-gh-muted text-lg mb-8">
          A browser-based Quantum Computing IDE.
          Build, simulate, and visualize quantum circuits with Qiskit Aer.
        </p>
        <Link
          href="/ide"
          className="inline-block px-6 py-3 rounded-md text-sm font-medium transition-colors"
          style={{
            background: '#238636',
            color: '#fff',
            border: '1px solid #2ea043',
          }}
        >
          Open IDE →
        </Link>
        <div className="mt-16 grid grid-cols-3 gap-6 text-left">
          {[
            { title: 'Drag & Drop', desc: 'Visual circuit builder with quantum-circuit.js' },
            { title: 'QASM Editor', desc: 'Monaco-powered code editor with OpenQASM 2.0' },
            { title: 'Qiskit Aer', desc: 'Real simulation with statevector + shot backends' },
          ].map((f) => (
            <div
              key={f.title}
              className="p-4 rounded-md"
              style={{ background: '#161B22', border: '1px solid #30363D' }}
            >
              <div className="text-gh-blue text-sm font-semibold mb-1">{f.title}</div>
              <div className="text-gh-muted text-xs">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
