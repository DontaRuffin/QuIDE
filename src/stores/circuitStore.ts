// QuIDE — Circuit State Store
// src/stores/circuitStore.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Circuit, Gate, CircuitMeta } from '@/types/circuit';

type UpdateSource = 'canvas' | 'code' | 'template' | null;

interface SimulationState {
  isRunning: boolean;
  results: SimulationResults | null;
  error: string | null;
}

export interface SimulationResults {
  counts: Record<string, number>;
  statevector?: Array<[number, number]>;
  shots: number;
  runtime_ms: number;
  backend: string;
}

interface CircuitStore {
  circuit: Circuit;
  qasm: string;
  updateSource: UpdateSource;
  isDirty: boolean;
  isSaving: boolean;
  selectedGateId: string | null;
  simulation: SimulationState;

  setQasmFromCanvas: (qasm: string) => void;
  setQasmFromCode: (qasm: string) => void;
  loadCircuit: (circuit: Circuit) => void;
  updateMeta: (meta: Partial<CircuitMeta>) => void;
  setNumQubits: (n: number) => void;
  clearCircuit: () => void;
  selectGate: (id: string | null) => void;
  removeSelectedGate: () => void;
  startSimulation: () => void;
  setSimulationResults: (results: SimulationResults) => void;
  setSimulationError: (error: string) => void;
  clearSimulation: () => void;
  setSaving: (saving: boolean) => void;
  markClean: () => void;
}

const DEFAULT_QASM = `OPENQASM 2.0;
include "qelib1.inc";
qreg q[3];
creg c[3];
`;

const defaultCircuit = (): Circuit => ({
  name: 'Untitled Circuit',
  numQubits: 3,
  numClbits: 3,
  gates: [],
  qasm: DEFAULT_QASM,
});

export const useCircuitStore = create<CircuitStore>()(
  devtools(
    (set, get) => ({
      circuit: defaultCircuit(),
      qasm: DEFAULT_QASM,
      updateSource: null,
      isDirty: false,
      isSaving: false,
      selectedGateId: null,
      simulation: { isRunning: false, results: null, error: null },

      setQasmFromCanvas: (qasm) => {
        set({ qasm, updateSource: 'canvas', isDirty: true, circuit: { ...get().circuit, qasm } });
        setTimeout(() => set({ updateSource: null }), 0);
      },

      setQasmFromCode: (qasm) => {
        set({ qasm, updateSource: 'code', isDirty: true, circuit: { ...get().circuit, qasm } });
        setTimeout(() => set({ updateSource: null }), 0);
      },

      loadCircuit: (circuit) => {
        set({ circuit, qasm: circuit.qasm, updateSource: 'template', isDirty: false, simulation: { isRunning: false, results: null, error: null } });
        setTimeout(() => set({ updateSource: null }), 0);
      },

      updateMeta: (meta) => set({ circuit: { ...get().circuit, ...meta }, isDirty: true }),

      setNumQubits: (n) => {
        const numQubits = Math.max(1, Math.min(20, n));
        const qasm = `OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[${numQubits}];\ncreg c[${numQubits}];\n`;
        set({ circuit: { ...defaultCircuit(), numQubits, numClbits: numQubits, qasm }, qasm, updateSource: 'canvas', isDirty: false, simulation: { isRunning: false, results: null, error: null } });
        setTimeout(() => set({ updateSource: null }), 0);
      },

      clearCircuit: () => {
        const { circuit } = get();
        const qasm = `OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[${circuit.numQubits}];\ncreg c[${circuit.numClbits}];\n`;
        set({ circuit: { ...circuit, gates: [], qasm }, qasm, updateSource: 'canvas', isDirty: true, simulation: { isRunning: false, results: null, error: null } });
        setTimeout(() => set({ updateSource: null }), 0);
      },

      selectGate: (id) => set({ selectedGateId: id }),

      removeSelectedGate: () => {
        const { selectedGateId, circuit } = get();
        if (!selectedGateId) return;
        const gates = circuit.gates.filter((g) => g.id !== selectedGateId);
        set({ circuit: { ...circuit, gates }, selectedGateId: null, isDirty: true });
      },

      startSimulation: () => set({ simulation: { isRunning: true, results: null, error: null } }),
      setSimulationResults: (results) => set({ simulation: { isRunning: false, results, error: null } }),
      setSimulationError: (error) => set({ simulation: { isRunning: false, results: null, error } }),
      clearSimulation: () => set({ simulation: { isRunning: false, results: null, error: null } }),
      setSaving: (isSaving) => set({ isSaving }),
      markClean: () => set({ isDirty: false }),
    }),
    { name: 'QuIDE Circuit Store' }
  )
);
