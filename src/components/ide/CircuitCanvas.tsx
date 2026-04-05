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
  addGate: (gateName: string, column: number, qubit: number | number[], options?: object) => void;
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
  style?: React.CSSProperties;
}

const DARK_THEME_CSS = `
  text { fill: #E6EDF3 !important; font-family: monospace !important; }
  line { stroke: #8B949E !important; }
  rect { stroke: #388BFD !important; fill: #1A3A5C !important; }
  rect.gate { fill: #1A3A5C !important; stroke: #388BFD !important; }
  text.gate-label { fill: #E6EDF3 !important; font-weight: bold !important; }
  .qc-gate-rect { fill: #1A3A5C !important; stroke: #388BFD !important; }
  .qc-gate-label { fill: #E6EDF3 !important; }
  svg { background: transparent !important; }
`;

export const CircuitCanvas = forwardRef<CircuitCanvasRef, CircuitCanvasProps>(
  ({ className = '', style }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const circuitRef = useRef<QuantumCircuitInstance | null>(null);
    const initializedRef = useRef(false);
    const isImporting = useRef(false);
    const lastEmittedQasm = useRef<string>('');

    const qasm = useCircuitStore((s) => s.qasm);
    const updateSource = useCircuitStore((s) => s.updateSource);
    const numQubits = useCircuitStore((s) => s.circuit.numQubits);
    const setQasmFromCanvas = useCircuitStore((s) => s.setQasmFromCanvas);

    const renderCanvas = useCallback(() => {
      const qc = circuitRef.current;
      const container = containerRef.current;
      if (!qc || !container) return;
      try {
        const svg = qc.exportSVG(true, { cellWidth: 60, cellHeight: 50 });
        const themedSvg = svg.replace('</svg>', `<style>${DARK_THEME_CSS}</style></svg>`);
        container.innerHTML = themedSvg;
      } catch (e) {
        console.warn('[QuIDE] SVG render error:', e);
      }
    }, []);

    const emitQasm = useCallback(() => {
      if (isImporting.current) return;
      const qc = circuitRef.current;
      if (!qc) return;
      const newQasm = qc.exportQASM('', false);
      if (newQasm === lastEmittedQasm.current) return;
      lastEmittedQasm.current = newQasm;
      setQasmFromCanvas(newQasm);
      renderCanvas();
    }, [setQasmFromCanvas, renderCanvas]);

    useEffect(() => {
      if (initializedRef.current) return;
      initializedRef.current = true;
      import('quantum-circuit').then((mod) => {
        const QuantumCircuit = mod.default ?? mod;
        const qc = new (QuantumCircuit as new (n: number) => QuantumCircuitInstance)(numQubits);
        circuitRef.current = qc;
        if (qasm && qasm.trim().length > 0) {
          isImporting.current = true;
          qc.importQASM(qasm, (err) => console.warn('[QuIDE] init error:', err));
          isImporting.current = false;
          lastEmittedQasm.current = qasm;
        }
        renderCanvas();
      }).catch((e) => console.error('[QuIDE] load error:', e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      if (updateSource !== 'code' && updateSource !== 'template') return;
      if (!circuitRef.current) return;
      if (qasm === lastEmittedQasm.current) return;
      isImporting.current = true;
      try {
        circuitRef.current.importQASM(qasm, (err) => console.warn('[QuIDE] import error:', err));
        lastEmittedQasm.current = qasm;
        renderCanvas();
      } finally {
        isImporting.current = false;
      }
    }, [qasm, updateSource, renderCanvas]);

    useImperativeHandle(ref, () => ({
      addGate: (gateName, qubit, column = -1) => {
        circuitRef.current?.addGate(gateName, column, qubit);
        emitQasm();
      },
      clear: () => {
        circuitRef.current?.clear();
        emitQasm();
      },
      setQasm: (newQasm) => {
        if (!circuitRef.current) return;
        isImporting.current = true;
        circuitRef.current.importQASM(newQasm, (err) => console.warn('[QuIDE] setQasm error:', err));
        isImporting.current = false;
        lastEmittedQasm.current = newQasm;
        renderCanvas();
      },
      exportQasm: () => circuitRef.current?.exportQASM('', false) ?? '',
    }));

    return (
      <div className={`relative w-full h-full overflow-auto ${className}`} style={{ background: '#0D1117' }}>
        <div
          ref={containerRef}
          style={style}
          className="min-w-full min-h-full p-4"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const gateName = e.dataTransfer.getData('gate');
            if (!gateName || !circuitRef.current) return;
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            const qubit = Math.max(0, Math.min(numQubits - 1, Math.floor((e.clientY - rect.top) / 50)));
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
