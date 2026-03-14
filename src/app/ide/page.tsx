'use client';

import { useRef } from 'react';
import { CircuitCanvas, CircuitCanvasRef } from '@/components/ide/CircuitCanvas';
import { useCircuitStore } from '@/stores/circuitStore';

const GATE_GROUPS = [
  {
    label: 'Single-Qubit',
    gates: [
      { name: 'h', label: 'H', color: '#1A3A5C', border: '#388BFD', desc: 'Hadamard' },
      { name: 'x', label: 'X', color: '#3D1A1A', border: '#F85149', desc: 'Pauli-X (NOT)' },
      { name: 'y', label: 'Y', color: '#3D2A1A', border: '#FFA657', desc: 'Pauli-Y' },
      { name: 'z', label: 'Z', color: '#1A1A3D', border: '#79C0FF', desc: 'Pauli-Z' },
      { name: 's', label: 'S', color: '#1A2A1A', border: '#3FB950', desc: 'S gate' },
      { name: 't', label: 'T', color: '#2A1A3D', border: '#D2A8FF', desc: 'T gate' },
    ],
  },
  {
    label: 'Two-Qubit',
    gates: [
      { name: 'cx', label: 'CX', color: '#1A2E4A', border: '#388BFD', desc: 'CNOT' },
      { name: 'swap', label: 'SWP', color: '#1A3A2A', border: '#3FB950', desc: 'SWAP' },
      { name: 'ccx', label: 'CCX', color: '#2A1A1A', border: '#F85149', desc: 'Toffoli' },
    ],
  },
  {
    label: 'Measure',
    gates: [
      { name: 'measure', label: 'M', color: '#1A3A2A', border: '#3FB950', desc: 'Measure' },
      { name: 'barrier', label: '|', color: '#161B22', border: '#8B949E', desc: 'Barrier' },
      { name: 'reset', label: 'R', color: '#2A1A1A', border: '#F85149', desc: 'Reset' },
    ],
  },
];

export default function IDEPage() {
  const canvasRef = useRef<CircuitCanvasRef>(null);
  const { circuit, qasm, isDirty, simulation, clearCircuit, setNumQubits } =
    useCircuitStore((s) => ({
      circuit: s.circuit,
      qasm: s.qasm,
      isDirty: s.isDirty,
      simulation: s.simulation,
      clearCircuit: s.clearCircuit,
      setNumQubits: s.setNumQubits,
    }));

  const handleSimulate = async () => {
    const store = useCircuitStore.getState();
    store.startSimulation();
    try {
      const serviceUrl = process.env.NEXT_PUBLIC_SIMULATION_API_URL ?? 'http://localhost:8000';
      const res = await fetch(`${serviceUrl}/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Key': process.env.NEXT_PUBLIC_SIMULATION_SERVICE_KEY ?? 'dev-key-change-in-prod',
        },
        body: JSON.stringify({ qasm, shots: 1024, include_statevector: true }),
      });
      if (!res.ok) {
        const err = await res.json();
        store.setSimulationError(err.detail ?? 'Simulation failed');
        return;
      }
      const result = await res.json();
      store.setSimulationResults(result);
    } catch (e) {
      store.setSimulationError(String(e));
    }
  };

  return (
    <div className="flex flex-col h-screen" style={{ background: '#0D1117', color: '#E6EDF3' }}>
      <header
        className="flex items-center justify-between px-4 py-2 text-sm"
        style={{ background: '#161B22', borderBottom: '1px solid #30363D' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-gh-blue font-semibold">⬡ QuIDE</span>
          <span className="text-gh-muted">/</span>
          <span className="text-gh-text">{circuit.name}</span>
          {isDirty && <span className="text-gh-muted text-xs">● unsaved</span>}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-gh-muted text-xs mr-1">Qubits:</label>
          <select
            value={circuit.numQubits}
            onChange={(e) => setNumQubits(Number(e.target.value))}
            className="text-xs px-2 py-1 rounded"
            style={{ background: '#0D1117', border: '1px solid #30363D', color: '#E6EDF3' }}
          >
            {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <button
            onClick={clearCircuit}
            className="px-3 py-1 rounded text-xs text-gh-muted hover:text-gh-text"
            style={{ border: '1px solid #30363D' }}
          >
            Clear
          </button>
          <button
            onClick={handleSimulate}
            disabled={simulation.isRunning}
            className="px-4 py-1 rounded text-xs font-medium disabled:opacity-50"
            style={{ background: '#238636', color: '#fff', border: '1px solid #2ea043' }}
          >
            {simulation.isRunning ? 'Running...' : '▶ Simulate'}
          </button>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside
          className="w-48 flex-shrink-0 overflow-y-auto p-3"
          style={{ background: '#161B22', borderRight: '1px solid #30363D' }}
        >
          {GATE_GROUPS.map((group) => (
            <div key={group.label} className="mb-4">
              <div className="text-xs text-gh-muted mb-2 uppercase tracking-wider">{group.label}</div>
              <div className="flex flex-col gap-1">
                {group.gates.map((gate) => (
                  <div
                    key={gate.name}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('gate', gate.name)}
                    title={gate.desc}
                    className="flex items-center gap-2 px-2 py-1.5 rounded cursor-grab text-xs select-none"
                    style={{ background: gate.color, border: `1px solid ${gate.border}`, color: '#E6EDF3' }}
                  >
                    <span className="font-bold w-8 text-center">{gate.label}</span>
                    <span className="text-gh-muted truncate">{gate.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </aside>
        <main className="flex-1 overflow-hidden flex flex-col">
          <CircuitCanvas ref={canvasRef} className="flex-1" />
          {(simulation.results || simulation.error) && (
            <div
              className="h-40 p-4 overflow-y-auto text-xs font-mono"
              style={{ background: '#161B22', borderTop: '1px solid #30363D' }}
            >
              {simulation.error ? (
                <div style={{ color: '#F85149' }}>Error: {simulation.error}</div>
              ) : simulation.results ? (
                <div>
                  <div className="text-gh-muted mb-1">
                    Backend: {simulation.results.backend} · {simulation.results.shots} shots · {simulation.results.runtimeMs}ms
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(simulation.results.counts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([state, count]) => (
                        <div
                          key={state}
                          className="px-2 py-1 rounded"
                          style={{ background: '#1A3A2A', border: '1px solid #3FB950' }}
                        >
                          <span style={{ color: '#3FB950' }}>{state}</span>
                          <span className="text-gh-muted ml-2">
                            {count} ({((count / simulation.results!.shots) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
