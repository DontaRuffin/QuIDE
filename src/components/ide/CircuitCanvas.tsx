// QuIDE — Circuit Canvas Component
// src/components/ide/CircuitCanvas.tsx
//
// Wraps the imperative quantum-circuit.js library
// in a controlled React interface with dark theme.

'use client';

import {
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { useCircuitStore } from '@/stores/circuitStore';

type QuantumCircuitInstance = {
  init: (numQubits: number) => void;
  addGate: (gateName: string, column: number, qubit: number | number[], options?: object) => void;
  removeGate: (column: number, qubit: number) => void;
  load: (obj: object) => void;
  exportQASM: (comment?: string, decompose?: boolean, exportAsGateName?: string) => string;
  importQASM: (qasm: string, errorCallback?: (err: unknown) => void) => void;
  exportSVG: (embedded?: boolean, options?: object) => string;
  clear: () => void;
  numQubits: number;
};

export interface CircuitCanvasRef {
  addGate: (gateName: string, qubit: number, column?: number) => void;
  clear: () => void;
  setQasm: (qasm: string) => void;
  exportQasm: () => string;
}

interface CircuitCanvasProps {
  className?: string;
}

const DARK_THEME_CSS = `
  .qc-gate-rect { fill: #161B22 !important; stroke: #30363D !important; }
  .qc-gate-label { fill: #E6EDF3 !important; font-family: 'JetBrains Mono', monospace !important; }
  .qc-wire { stroke: #30363D !important; }
  .qc-measure { stroke: #3FB950 !important; fill: none !important; }
  .qc-control { fill: #58A6FF !important; }
  .qc-not { stroke: #58A6FF !important; fill: none !important; }
  .qc-gate-h .qc-gate-rect { fill: #1A3A5C !important; stroke: #388BFD !important; }
  .qc-gate-x .qc-gate-rect { fill: #3D1A1A !important; stroke: #F85149 !important; }
  .qc-gate-cx .qc-gate-rect { fill: #1A2E4A !important; stroke: #388BFD !important; }
  .qc-gate-measure .qc-gate-rect { fill: #1A3A2A !important; stroke: #3FB950 !important; }
  text { fill: #E6EDF3 !important; }
  line { stroke: #30363D !important; }
`;

export const CircuitCanvas = forwardRef<CircuitCanvasRef, CircuitCanvasProps>(
  ({ className = '' }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const circuitRef = useRef<QuantumCircuitInstance | null>(null);
    const isUpdatingFromCode = useRef(false);

    const { qasm, updateSource, numQubits, setQasmFromCanvas } = useCircuitStore((s) => ({
      qasm: s.qasm,
      updateSource: s.updateSource,
      numQubits: s.circuit.numQubits,
      setQasmFromCanvas: s.setQasmFromCanvas,
    }));

    useEffect(() => {
      let mounted = true;
      import('quantum-circuit').then((mod) => {
        if (!mounted || !containerRef.current) return;
        const QuantumCircuit = mod.default ?? mod.QuantumCircuit ?? mod;
        const qc = new QuantumCircuit(numQubits) as QuantumCircuitInstance;
        circuitRef.current = qc;
        renderCanvas();
      });
      return () => { mounted = false; };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      if (!circuitRef.current) return;
      if (updateSource === 'canvas') return;
      isUpdatingFromCode.current = true;
      try {
        circuitRef.current.importQASM(qasm, (err) => {
          console.warn('[QuIDE] QASM parse error:', err);
        });
        renderCanvas();
      } finally {
        isUpdatingFromCode.current = false;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [qasm, updateSource]);

    const renderCanvas = useCallback(() => {
      const qc = circuitRef.current;
      const container = containerRef.current;
      if (!qc || !container) return;
      const svg = qc.exportSVG(true, { cellWidth: 60, cellHeight: 50, hSpacing: 1.0, vSpacing: 1.0 });
      const themedSvg = svg
        .replace('<svg', `<svg style="background: #0D1117;"`)
        .replace('</svg>', `<style>${DARK_THEME_CSS}</style></svg>`);
      container.innerHTML = themedSvg;
      attachGateListeners();
    }, []);

    const attachGateListeners = useCallback(() => {
      const container = containerRef.current;
      if (!container) return;
      container.querySelectorAll('[data-column]').forEach((el) => {
        (el as SVGElement).style.cursor = 'pointer';
      });
    }, []);

    const emitQasm = useCallback(() => {
      const qc = circuitRef.current;
      if (!qc || isUpdatingFromCode.current) return;
      const newQasm = qc.exportQASM('', false);
      setQasmFromCanvas(newQasm);
      renderCanvas();
    }, [setQasmFromCanvas, renderCanvas]);

    useImperativeHandle(ref, () => ({
      addGate: (gateName, qubit, column) => {
        const qc = circuitRef.current;
        if (!qc) return;
        const col = column ?? nextAvailableColumn(qc, qubit);
        qc.addGate(gateName, col, qubit);
        emitQasm();
      },
      clear: () => {
        circuitRef.current?.clear();
        emitQasm();
      },
      setQasm: (newQasm) => {
        const qc = circuitRef.current;
        if (!qc) return;
        isUpdatingFromCode.current = true;
        qc.importQASM(newQasm, (err) => { console.warn('[QuIDE] QASM import error:', err); });
        isUpdatingFromCode.current = false;
        renderCanvas();
      },
      exportQasm: () => circuitRef.current?.exportQASM('', false) ?? '',
    }));

    return (
      <div
        className={`relative w-full h-full overflow-auto ${className}`}
        style={{ background: '#0D1117' }}
      >
        <div
          ref={containerRef}
          className="min-w-full min-h-full p-4"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const gateName = e.dataTransfer.getData('gate');
            if (!gateName || !circuitRef.current) return;
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            const relY = e.clientY - rect.top;
            const qubit = Math.floor(relY / 50);
            const clampedQubit = Math.max(0, Math.min(numQubits - 1, qubit));
            circuitRef.current.addGate(gateName, -1, clampedQubit);
            emitQasm();
          }}
          aria-label="Quantum circuit canvas"
        />
        {!qasm.includes('h ') && !qasm.includes('x ') && !qasm.includes('cx ') && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center opacity-30">
              <div className="text-4xl mb-2">⬡</div>
              <div className="text-sm" style={{ color: '#8B949E', fontFamily: 'monospace' }}>
                Drag gates from the toolbar
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

CircuitCanvas.displayName = 'CircuitCanvas';

function nextAvailableColumn(qc: QuantumCircuitInstance, qubit: number): number {
  const gates = (qc as unknown as { gates: unknown[][][] }).gates;
  if (!gates) return 0;
  for (let col = 0; col < (gates[0]?.length ?? 0) + 1; col++) {
    const occupied = gates.some((row) => row[col]?.length > 0);
    if (!occupied) return col;
  }
  return (gates[0]?.length ?? 0);
}
