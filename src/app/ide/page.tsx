'use client';

import { useRef, useState, useEffect } from 'react';
import { CircuitCanvas, CircuitCanvasRef } from '@/components/ide/CircuitCanvas';
import { useCircuitStore } from '@/stores/circuitStore';
import AIConfigModal from '@/components/ide/AIConfigModal';
import IBMConfigModal from '@/components/ide/IBMConfigModal';
import CircuitExplanation from '@/components/ide/CircuitExplanation';
import { anthropicKeyStorage } from '@/lib/anthropicKeyStorage';
import { ibmKeyStorage } from '@/lib/ibmKeyStorage';
import { listIBMBackends, estimateIBMCost, runOnIBMHardware, type IBMBackend, type CostEstimate } from '@/lib/ibmApi';
import OnboardingModal from '@/components/ide/OnboardingModal';
import { onboardingStorage } from '@/lib/onboardingStorage';

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
  const [isAIConfigOpen, setIsAIConfigOpen] = useState(false);
  const [isIBMConfigOpen, setIsIBMConfigOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [hasIBMKey, setHasIBMKey] = useState(false);
  const [rightPanelView, setRightPanelView] = useState<'code' | 'explain'>('code');

  // IBM backend state
  const [selectedBackend, setSelectedBackend] = useState<string>('aer_simulator');
  const [ibmBackends, setIbmBackends] = useState<IBMBackend[]>([]);
  const [loadingBackends, setLoadingBackends] = useState(false);
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null);
  const [showCostEstimate, setShowCostEstimate] = useState(false);

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

  // Check for API keys on mount
  useEffect(() => {
    setHasApiKey(anthropicKeyStorage.hasKey());
    setHasIBMKey(ibmKeyStorage.hasKey());

    // Show onboarding on first visit
    if (!onboardingStorage.hasCompleted()) {
      setIsOnboardingOpen(true);
    }
  }, []);

  // Load IBM backends when IBM key is available
  useEffect(() => {
    const loadIBMBackends = async () => {
      if (!hasIBMKey) {
        setIbmBackends([]);
        return;
      }

      const credentials = ibmKeyStorage.load();
      if (!credentials) return;

      setLoadingBackends(true);
      try {
        const backends = await listIBMBackends(
          credentials.apiKey,
          credentials.region,
          credentials.instanceCrn
        );
        setIbmBackends(backends);
      } catch (error) {
        console.error('Failed to load IBM backends:', error);
        setIbmBackends([]);
      } finally {
        setLoadingBackends(false);
      }
    };

    loadIBMBackends();
  }, [hasIBMKey]);

  const handleAIConfigSave = () => {
    setHasApiKey(anthropicKeyStorage.hasKey());
  };

  const handleIBMConfigSave = () => {
    setHasIBMKey(ibmKeyStorage.hasKey());
  };

  const handleSimulate = async () => {
    const isIBMBackend = selectedBackend !== 'aer_simulator' && selectedBackend !== 'aer_simulator_shot';

    // Show cost estimate for IBM hardware before running
    if (isIBMBackend) {
      const backend = ibmBackends.find((b) => b.name === selectedBackend);
      if (!backend) {
        setSimulationError('Selected IBM backend not found');
        return;
      }

      // Show cost estimate modal
      try {
        const estimate = await estimateIBMCost(qasm, backend.name, 1024, backend.t1, backend.t2);
        setCostEstimate(estimate);
        setShowCostEstimate(true);
        return; // Wait for user confirmation
      } catch (error) {
        console.error('Cost estimation failed:', error);
        // Continue anyway
      }
    }

    // Run simulation
    await executeSimulation();
  };

  const executeSimulation = async () => {
    startSimulation();
    setShowCostEstimate(false);

    try {
      const isIBMBackend = selectedBackend !== 'aer_simulator' && selectedBackend !== 'aer_simulator_shot';

      if (isIBMBackend) {
        // IBM hardware execution
        const credentials = ibmKeyStorage.load();
        if (!credentials) {
          setSimulationError('IBM API key not configured');
          return;
        }

        const backend = ibmBackends.find((b) => b.name === selectedBackend);
        if (!backend) {
          setSimulationError('Selected IBM backend not found');
          return;
        }

        const result = await runOnIBMHardware(
          qasm,
          backend,
          1024,
          credentials.apiKey,
          credentials.region,
          credentials.instanceCrn
        );

        setSimulationResults(result);
      } else {
        // Aer simulation
        const simulationUrl = process.env.NEXT_PUBLIC_SIMULATION_URL || 'http://localhost:8000';
        const res = await fetch(`${simulationUrl}/simulate`, {
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
      }
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
    rightPanel: { width: '400px', flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#161B22', borderLeft: '1px solid #30363D' },
    rightPanelHeader: { padding: '8px 12px', borderBottom: '1px solid #30363D', display: 'flex', gap: '8px', alignItems: 'center' },
    rightPanelContent: { flex: 1, overflow: 'auto', padding: '12px', fontSize: '13px' },
    toggleBtn: { padding: '4px 12px', background: 'transparent', border: '1px solid #30363D', borderRadius: '4px', color: '#8B949E', cursor: 'pointer', fontSize: '12px' },
    toggleBtnActive: { padding: '4px 12px', background: '#1A3A5C', border: '1px solid #388BFD', borderRadius: '4px', color: '#E6EDF3', cursor: 'pointer', fontSize: '12px', fontWeight: 500 },
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
          <label style={{ color: '#8B949E' }}>Backend:</label>
          <select
            value={selectedBackend}
            onChange={(e) => setSelectedBackend(e.target.value)}
            style={{ ...S.select, minWidth: '160px' }}
          >
            <optgroup label="Aer Simulators">
              <option value="aer_simulator">Aer Simulator (statevector)</option>
              <option value="aer_simulator_shot">Aer Simulator (shot-based)</option>
            </optgroup>
            {ibmBackends.length > 0 && (
              <optgroup label="IBM Hardware">
                {ibmBackends.map((backend) => (
                  <option key={backend.name} value={backend.name}>
                    {backend.name} ({backend.num_qubits}q)
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <label style={{ color: '#8B949E' }}>Qubits:</label>
          <select value={numQubits} onChange={(e) => setNumQubits(Number(e.target.value))} style={S.select}>
            {[1,2,3,4,5,6,8,10,12].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <button onClick={clearCircuit} style={S.btnClear}>Clear</button>
          <button
            onClick={() => setIsOnboardingOpen(true)}
            style={{ ...S.btnClear, color: '#8B949E' }}
            title="Help & Tutorial"
          >
            ?
          </button>
          <button
            onClick={() => setIsAIConfigOpen(true)}
            style={{ ...S.btnClear, color: hasApiKey ? '#3FB950' : '#8B949E' }}
            title="Configure AI Assistant"
          >
            ⚙ AI
          </button>
          <button
            onClick={() => setIsIBMConfigOpen(true)}
            style={{ ...S.btnClear, color: hasIBMKey ? '#3FB950' : '#8B949E' }}
            title="Configure IBM Quantum"
          >
            ⚙ IBM
          </button>
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
                    {simResults.backend_type === 'ibm' && simResults.ibm_job_id && (
                      <>
                        {' '}· Job: {simResults.ibm_job_id}
                        {simResults.queue_time_ms && simResults.queue_time_ms > 0 && (
                          <> · Queue: {(simResults.queue_time_ms / 1000).toFixed(1)}s</>
                        )}
                        {simResults.transpiled_depth && (
                          <> · Transpiled depth: {simResults.transpiled_depth}</>
                        )}
                      </>
                    )}
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

        {/* Right Panel: Code / Explain */}
        <div style={S.rightPanel}>
          <div style={S.rightPanelHeader}>
            <button
              onClick={() => setRightPanelView('code')}
              style={rightPanelView === 'code' ? S.toggleBtnActive : S.toggleBtn}
            >
              Code
            </button>
            <button
              onClick={() => setRightPanelView('explain')}
              style={rightPanelView === 'explain' ? S.toggleBtnActive : S.toggleBtn}
            >
              Explain
            </button>
          </div>
          <div style={S.rightPanelContent}>
            {rightPanelView === 'code' ? (
              <textarea
                value={qasm}
                readOnly
                style={{
                  width: '100%',
                  height: '100%',
                  background: '#0D1117',
                  border: '1px solid #30363D',
                  borderRadius: '4px',
                  color: '#E6EDF3',
                  padding: '8px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  resize: 'none',
                }}
              />
            ) : (
              <CircuitExplanation qasm={qasm} numQubits={numQubits} hasApiKey={hasApiKey} />
            )}
          </div>
        </div>
      </div>

      <AIConfigModal
        isOpen={isAIConfigOpen}
        onClose={() => setIsAIConfigOpen(false)}
        onSave={handleAIConfigSave}
      />

      <IBMConfigModal
        isOpen={isIBMConfigOpen}
        onClose={() => {
          setIsIBMConfigOpen(false);
          handleIBMConfigSave();
        }}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={() => {
          onboardingStorage.save();
          setIsOnboardingOpen(false);
        }}
      />

      {/* Cost Estimate Modal */}
      {showCostEstimate && costEstimate && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowCostEstimate(false)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">IBM Hardware Cost Estimate</h2>

            <div className="mb-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Backend:</span>
                <span>{costEstimate.backend_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Circuit Depth:</span>
                <span>{costEstimate.circuit_depth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Shots:</span>
                <span>{costEstimate.shots}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">QPU Time:</span>
                <span>{(costEstimate.qpu_time_minutes * 60).toFixed(2)}s</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-700">
                <span>Estimated Cost:</span>
                <span className={costEstimate.is_free_tier ? 'text-green-400' : 'text-yellow-400'}>
                  {costEstimate.is_free_tier ? 'FREE' : `$${costEstimate.estimated_cost_usd.toFixed(4)}`}
                </span>
              </div>
            </div>

            {costEstimate.warning_message && (
              <div
                className={`mb-4 p-3 rounded text-sm ${
                  costEstimate.is_free_tier
                    ? 'bg-green-900/30 border border-green-700 text-green-300'
                    : costEstimate.decoherence_warning
                    ? 'bg-yellow-900/30 border border-yellow-700 text-yellow-300'
                    : 'bg-blue-900/30 border border-blue-700 text-blue-300'
                }`}
              >
                {costEstimate.warning_message}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={executeSimulation}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white font-medium transition-colors"
              >
                Confirm & Run
              </button>
              <button
                onClick={() => setShowCostEstimate(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}