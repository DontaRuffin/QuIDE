'use client';

import { useRef } from 'react';
import { CircuitCanvas, CircuitCanvasRef } from '@/components/ide/CircuitCanvas';
import { useCircuitStore } from '@/stores/circuitStore';

const GATE_GROUPS = [
  { label: 'Single-Qubit', gates: [
    { name: 'h', label: 'H', color: '#1A3A5C', border: '#388BFD', desc: 'Hadamard' },
    { name: 'x', label: 'X', color: '#3D1A1A', border: '#F85149', desc: 'Pauli-X' },
    { name: 'y', label: 'Y', color: '#3D2A1A', border: '#FFA657', desc: 'Pauli-Y' },
    { name: 'z', label: 'Z', color: '#1A1A3D', border: '#79C0FF', desc: 'Pauli-Z' },
    { name: 's', label: 'S', color: '#1A2A1A', border: '#3FB950', desc: 'S gate' },
    { name: 't', label: 'T', color: '#2A1A3D', border: '#D2A8FF', desc: 'T gate' },
  ]},
  { label: 'Two-Qubit', gates: [
    { name: 'cx', label: 'CX', color: '#1A2E4A', border: '#388BFD', desc: 'CNOT' },
    { name: 'swap', label: 'SWP', color: '#1A3A2A', border: '#3FB950', desc: 'SWAP' },
    { name: 'ccx', label: 'CCX', color: '#2A1A1A', border: '#F85149', desc: 'Toffoli' },
  ]},
  { label: 'Measure', gates: [
    { name: 'measure', label: 'M', color: '#1A3A2A', border: '#3FB950', desc: 'Measure' },
    { name: 'barrier', label: '|', color: '#161B22', border: '#8B949E', desc: 'Barrier' },
    { name: 'reset', label: 'R', color: '#2A1A1A', border: '#F85149', desc: 'Reset' },
  ]},
];

export default function IDEPage() {
  const canvasRef = useRef<CircuitCanvasRef>(null);
  const circuitName = useCircuitStore((s) => s.circuit.name);
  const numQubits = useCircuitStore((s) => s.circuit.numQubits);
  const qasm = useCircuitStore((s) => s.qasm);
  const isDirty = useCircuitStore((s) => s.isDirty);
  const isRunning = useCircuitStore((s) => s.simulation.isRunning);
  const simResults = useCircuitStore((s) => s.simulation.results);
  const simError = useCircuitStore((s) => s.simulation.error);
  const clearCircuit = useCircuitStore((s) => s.clearCircuit);
  const setNumQubits = useCircuitStore((s) => s.setNumQubits);
  const startSimulation = useCircuitStore((s) => s.startSimulation);
  const setSimulationResults = useCircuitStore((s) => s.setSimulationResults);
  const setSimulationError = useCircuitStore((s) => s.setSimulationError);

  const handleSimulate = async () => {
    startSimulation();
    try {
      const res = await fetch('http://localhost:8000/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Key': 'dev-key-change-in-prod',
        },
        body: JSON.stringify({ qasm, shots: 1024, include_statevector: true }),
      });
      if (!res.ok) {
        const err = await res.json();
        setSimulationError(err.detail ?? 'Simulation failed');
        return;
      }
      setSimulationResults(await res.json());
    } catch (e) {
      setSimulationError(String(e));
    }
  };

  const S: Record<string, React.CSSProperties> = {
    root: { display: 'flex', flexDirection: 'column', height: '100vh', background: '#0D1117', color: '#E6EDF3', fontFamily: 'monospace' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: '#161B22', borderBottom: '1px solid #30363D', flexShrink: 0 },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' },
    headerRight: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' },
    body: { display: 'flex', flex: 1, overflow: 'hidden' },
    sidebar: { width: '180px', flexShrink: 0, overflowY: 'auto', padding: '12px', background: '#161B22', borderRight: '1px solid #30363D' },
    main: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
    results: { height: '160px', padding: '12px 16px', overflowY: 'auto', fontSize: '11px', fontFamily: 'monospace', background: '#161B22', borderTop: '1px solid #30363D', flexShrink: 0 },
    select: { background: '#0D1117', border: '1px solid #30363D', color: '#E6EDF3', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' },
    btnClear: { padding: '3px 10px', border: '1px solid #30363D', background: 'transparent', color: '#8B949E', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
    btnRun: { padding: '3px 14px', background: '#238636', color: '#fff', border: '1px solid #2ea043', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 500 },
    groupLabel: { fontSize: '10px', color: '#8B949E', marginBottom: '6px', textTransform: 'uppercase' as const, letterSpacing: '1px' },
    gateList: { display: 'flex', flexDirection: 'column' as const, gap: '4px' },
  };

  return (
    <div style={S.root}>
      <div style={S.header}>
        <div style={S.headerLeft}>
          <span style={{ color: '#58A6FF', fontWeight: 600 }}>⬡ QuIDE</span>
          <span style={{ color: '#8B949E' }}>/</span>
          <span>{circuitName}</span>
          {isDirty && <span style={{ color: '#8B949E', fontSize: '11px' }}>● unsaved</span>}
        </div>
        <div style={S.headerRight}>
          <label style={{ color: '#8B949E' }}>Qubits:</label>
          <select value={numQubits} onChange={(e) => setNumQubits(Number(e.target.value))} style={S.select}>
            {[1,2,3,4,5,6,8,10,12].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <button onClick={clearCircuit} style={S.btnClear}>Clear</button>
          <button onClick={handleSimulate} disabled={isRunning} style={{ ...S.btnRun, opacity: isRunning ? 0.5 : 1 }}>
            {isRunning ? 'Running...' : '▶ Simulate'}
          </button>
        </div>
      </div>

      <div style={S.body}>
        <div style={S.sidebar}>
          {GATE_GROUPS.map((group) => (
            <div key={group.label} style={{ marginBottom: '16px' }}>
              <div style={S.groupLabel}>{group.label}</div>
              <div style={S.gateList}>
                {group.gates.map((gate) => (
                  <div
                    key={gate.name}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('gate', gate.name)}
                    title={gate.desc}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 8px', borderRadius: '4px', cursor: 'grab', fontSize: '11px', background: gate.color, border: `1px solid ${gate.border}`, color: '#E6EDF3', userSelect: 'none' }}
                  >
                    <span style={{ fontWeight: 700, width: '28px', textAlign: 'center' }}>{gate.label}</span>
                    <span style={{ color: '#8B949E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gate.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={S.main}>
          <CircuitCanvas ref={canvasRef} className="flex-1" />
          {(simResults || simError) && (
            <div style={S.results}>
              {simError ? (
                <div style={{ color: '#F85149' }}>Error: {simError}</div>
              ) : simResults ? (
                <div>
                  <div style={{ color: '#8B949E', marginBottom: '6px' }}>
                    Backend: {simResults.backend} · {simResults.shots} shots · {simResults.runtime_ms}ms
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {Object.entries(simResults.counts)
                      .sort((a, b) => (b[1] as number) - (a[1] as number))
                      .map(([state, count]) => (
                        <div key={state} style={{ padding: '3px 10px', background: '#1A3A2A', border: '1px solid #3FB950', borderRadius: '4px' }}>
                          <span style={{ color: '#3FB950' }}>{state}</span>
                          <span style={{ color: '#8B949E', marginLeft: '8px' }}>
                            {count as number} ({(((count as number) / simResults.shots) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}