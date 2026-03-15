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
  exportQASM: (comment?: string, decompose?: boolean) => string;
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
  text { fill: #E6EDF3 !important; }
  line { stroke: #30363D !important; }
  rect { stroke: #30363D !important; }
  .qc-wire { stroke: #30363D !important; }
`;

export const CircuitCanvas = forwardRef<CircuitCanvasRef, CircuitCanvasProps>(
  ({ className = '' }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const circuitRef = useRef<QuantumCircuitInstance | null>(null);
    const initializedRef = useRef(false);

    // ── Critical: these refs prevent the infinite loop ──
    // isImporting: true while we're loading QASM into the lib (suppress emit)
    const isImporting = useRef(false);
    // lastEmittedQasm: prevents emitting the same QASM twice back-to-back
    const lastEmittedQasm = useRef<string>('');

    // Only subscribe to what we need — use individual selectors to avoid
    // object reference churn that triggers re-renders
    const qasm = useCircuitStore((s) => s.qasm);
    const updateSource = useCircuitStore((s) => s.updateSource);
    const numQubits = useCircuitStore((s) => s.circuit.numQubits);
    const setQasmFromCanvas = useCircuitStore((s) => s.setQasmFromCanvas);

    // ── Render SVG ─────────────────────────────────────
    const renderCanvas = useCallback(() => {
      const qc = circuitRef.current;
      const container = containerRef.current;
      if (!qc || !container) return;

      try {
        const svg = qc.exportSVG(true, {
          cellWidth: 60,
          cellHeight: 50,
        });

        const themedSvg = svg.replace(
          '</svg>',
          `<style>${DARK_THEME_CSS}</style></svg>`
        );

        container.innerHTML = themedSvg;
      } catch (e) {
        console.warn('[QuIDE] SVG render error:', e);
      }
    }, []); // no deps — pure imperative operation

    // ── Emit QASM to store after a canvas mutation ─────
    const emitQasm = useCallback(() => {
      if (isImporting.current) return; // we're loading, not the user
      const qc = circuitRef.current;
      if (!qc) return;

      const newQasm = qc.exportQASM('', false);

      // Deduplicate — don't emit the same string twice
      if (newQasm === lastEmittedQasm.current) return;
      lastEmittedQasm.current = newQasm;

      setQasmFromCanvas(newQasm);
      renderCanvas();
    }, [setQasmFromCanvas, renderCanvas]);

    // ── Initialize once on mount ───────────────────────
    useEffect(() => {
      if (initializedRef.current) return;
      initializedRef.current = true;

      import('quantum-circuit').then((mod) => {
        const QuantumCircuit = mod.default ?? (mod as unknown as { QuantumCircuit: unknown }).QuantumCircuit ?? mod;
        const qc = new (QuantumCircuit as new (n: number) => QuantumCircuitInstance)(numQubits);
        circuitRef.current = qc;

        // Load initial QASM if present
        if (qasm && qasm.trim().length > 0) {
          isImporting.current = true;
          qc.importQASM(qasm, (err) => console.warn('[QuIDE] init QASM error:', err));
          isImporting.current = false;
          lastEmittedQasm.current = qasm;
        }

        renderCanvas();
      }).catch((e) => console.error('[QuIDE] Failed to load quantum-circuit:', e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // intentionally empty — init once only

    // ── Sync canvas when code editor changes QASM ─────
    useEffect(() => {
      // Only react to changes originating from the code editor
      // If source is 'canvas' or null, we triggered it — skip
      if (updateSource !== 'code' && updateSource !== 'template') return;
      if (!circuitRef.current) return;
      if (qasm === lastEmittedQasm.current) return;

      isImporting.current = true;
      try {
        circuitRef.current.importQASM(qasm, (err) => {
          console.warn('[QuIDE] QASM import error:', err);
        });
        lastEmittedQasm.current = qasm;
        renderCanvas();
      } finally {
        isImporting.current = false;
      }
    }, [qasm, updateSource, renderCanvas]);

    // ── Imperative API ─────────────────────────────────
    useImperativeHandle(ref, () => ({
      addGate: (gateName, qubit, column = -1) => {
        const qc = circuitRef.current;
        if (!qc) return;
        qc.addGate(gateName, column, qubit);
        emitQasm();
      },
      clear: () => {
        circuitRef.current?.clear();
        emitQasm();
      },
      setQasm: (newQasm) => {
        const qc = circuitRef.current;
        if (!qc) return;
        isImporting.current = true;
        qc.importQASM(newQasm, (err) => console.warn('[QuIDE] setQasm error:', err));
        isImporting.current = false;
        lastEmittedQasm.current = newQasm;
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
            const qubit = Math.max(0, Math.min(numQubits - 1, Math.floor(relY / 50)));

            circuitRef.current.addGate(gateName, -1, qubit);
            emitQasm();
          }}
          aria-label="Quantum circuit canvas"
        />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center opacity-20 select-none">
            <div className="text-5xl mb-3">⬡</div>
            <div className="text-sm font-mono" style={{ color: '#8B949E' }}>
              Drag gates from the toolbar to build your circuit
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CircuitCanvas.displayName = 'CircuitCanvas';
