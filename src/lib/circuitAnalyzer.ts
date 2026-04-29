// QuIDE — Rule-based circuit analyzer
// Parses QASM and produces hardware-aware warnings without any backend call.

import type { IBMBackend } from './ibmApi';

export type Severity = 'error' | 'warning' | 'info';

export interface Finding {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
}

interface ParsedCircuit {
  numQubits: number;
  numClbits: number;
  gates: ParsedGate[];
  hasMeasure: boolean;
}

interface ParsedGate {
  name: string;
  qubits: number[];
}

// --- QASM parser -----------------------------------------------------------

function parseQasm(qasm: string): ParsedCircuit {
  const lines = qasm.split('\n').map((l) => l.trim()).filter(Boolean);

  let numQubits = 0;
  let numClbits = 0;
  const gates: ParsedGate[] = [];
  let hasMeasure = false;

  for (const line of lines) {
    // Skip header / include lines
    if (line.startsWith('OPENQASM') || line.startsWith('include')) continue;

    // qreg q[N];
    const qregMatch = line.match(/^qreg\s+\w+\[(\d+)\];/);
    if (qregMatch) { numQubits = parseInt(qregMatch[1], 10); continue; }

    // creg c[N];
    const cregMatch = line.match(/^creg\s+\w+\[(\d+)\];/);
    if (cregMatch) { numClbits = parseInt(cregMatch[1], 10); continue; }

    // measure q[i] -> c[j];
    const measureMatch = line.match(/^measure\s+\w+\[(\d+)\]\s*->/);
    if (measureMatch) {
      hasMeasure = true;
      gates.push({ name: 'measure', qubits: [parseInt(measureMatch[1], 10)] });
      continue;
    }

    // barrier — skip for analysis
    if (line.startsWith('barrier')) continue;

    // gate op: name q[i]; or name q[i],q[j]; or name(params) q[i],...
    const opMatch = line.match(/^(\w+)(?:\([^)]*\))?\s+(.+);/);
    if (!opMatch) continue;

    const name = opMatch[1].toLowerCase();
    const operandStr = opMatch[2];

    // Extract qubit indices — match w+[N] patterns
    const qubitRegex = /\w+\[(\d+)\]/g;
    const qubits: number[] = [];
    let qm: RegExpExecArray | null;
    while ((qm = qubitRegex.exec(operandStr)) !== null) {
      qubits.push(parseInt(qm[1], 10));
    }

    if (qubits.length > 0) {
      gates.push({ name, qubits });
    }
  }

  return { numQubits, numClbits, gates, hasMeasure };
}

// --- Rule checks -----------------------------------------------------------

function checkEmpty(parsed: ParsedCircuit): Finding | null {
  const nonMeasure = parsed.gates.filter((g) => g.name !== 'measure');
  if (nonMeasure.length === 0) {
    return {
      id: 'empty',
      severity: 'info',
      title: 'Empty circuit',
      detail: 'No gates placed yet. Drag gates from the left rail onto the qubit lines.',
    };
  }
  return null;
}

function checkNoMeasure(parsed: ParsedCircuit): Finding | null {
  const hasGates = parsed.gates.some((g) => g.name !== 'measure');
  if (hasGates && !parsed.hasMeasure) {
    return {
      id: 'no_measure',
      severity: 'warning',
      title: 'No measurements',
      detail: 'The circuit has gates but no measurement operations. Simulation will run but you won\'t get bitstring counts — add M gates to read out results.',
    };
  }
  return null;
}

function checkQubitOverflow(parsed: ParsedCircuit, backend: IBMBackend): Finding | null {
  if (parsed.numQubits > backend.num_qubits) {
    return {
      id: 'qubit_overflow',
      severity: 'error',
      title: `Too many qubits for ${backend.name}`,
      detail: `Circuit uses ${parsed.numQubits} qubits but ${backend.name} only has ${backend.num_qubits}. Reduce qubit count or choose a larger backend.`,
    };
  }
  return null;
}

function checkBasisGates(parsed: ParsedCircuit, backend: IBMBackend): Finding | null {
  const skipGates = new Set(['measure', 'barrier', 'reset']);
  const basisSet = new Set(backend.basis_gates.map((g) => g.toLowerCase()));

  // Common decomposable aliases the transpiler handles automatically —
  // flag them as warnings (will be transpiled) rather than errors
  const needsTranspile: string[] = [];

  for (const gate of parsed.gates) {
    if (skipGates.has(gate.name)) continue;
    if (!basisSet.has(gate.name)) {
      needsTranspile.push(gate.name);
    }
  }

  const unique = needsTranspile.filter((g, i, arr) => arr.indexOf(g) === i);
  if (unique.length === 0) return null;

  return {
    id: 'non_basis_gates',
    severity: 'warning',
    title: 'Gates outside backend basis set',
    detail: `Gates [${unique.join(', ')}] are not native to ${backend.name} (basis: ${backend.basis_gates.join(', ')}). The transpiler will decompose them — this adds extra gates and increases circuit depth.`,
  };
}

function checkCouplingMap(parsed: ParsedCircuit, backend: IBMBackend): Finding | null {
  if (!backend.coupling_map || backend.coupling_map.length === 0) return null;

  const edgeSet = new Set(backend.coupling_map.map(([a, b]) => `${a}-${b}`));
  const twoQubitGates = ['cx', 'cz', 'ecr', 'swap', 'ccx', 'rzz', 'rxx'];

  const violations: string[] = [];

  for (const gate of parsed.gates) {
    if (!twoQubitGates.includes(gate.name)) continue;
    if (gate.qubits.length < 2) continue;

    const [q0, q1] = gate.qubits;
    const forward = `${q0}-${q1}`;
    const reverse = `${q1}-${q0}`;

    if (!edgeSet.has(forward) && !edgeSet.has(reverse)) {
      violations.push(`${gate.name.toUpperCase()} q[${q0}]→q[${q1}]`);
    }
  }

  if (violations.length === 0) return null;

  return {
    id: 'coupling_map',
    severity: 'error',
    title: 'Qubit connectivity violations',
    detail: `${violations.length} gate(s) connect non-adjacent qubits on ${backend.name}: ${violations.slice(0, 3).join(', ')}${violations.length > 3 ? ` +${violations.length - 3} more` : ''}. The transpiler will insert SWAP gates to route them, which degrades fidelity.`,
  };
}

function checkDecoherence(parsed: ParsedCircuit, backend: IBMBackend): Finding | null {
  if (!backend.t1 || !backend.t2) return null;

  const gateCount = parsed.gates.filter((g) => g.name !== 'measure').length;
  if (gateCount === 0) return null;

  // Rough estimate: 1Q gate ~50ns, 2Q gate ~300ns
  const oneQ = parsed.gates.filter((g) => g.qubits.length === 1 && g.name !== 'measure').length;
  const twoQ = parsed.gates.filter((g) => g.qubits.length >= 2).length;
  const estimatedTimeUs = (oneQ * 0.05 + twoQ * 0.3); // in µs

  const limitUs = Math.min(backend.t1, backend.t2);
  const ratio = estimatedTimeUs / limitUs;

  if (ratio < 0.3) return null;

  const severity: Severity = ratio >= 0.8 ? 'error' : 'warning';
  const pct = Math.round(ratio * 100);

  return {
    id: 'decoherence',
    severity,
    title: `Circuit depth near decoherence limit (${pct}% of T₂)`,
    detail: `Estimated gate time ~${estimatedTimeUs.toFixed(2)}µs vs backend T₂=${backend.t2}µs, T₁=${backend.t1}µs. ${ratio >= 0.8 ? 'At this depth, significant decoherence errors are likely. Simplify the circuit.' : 'Consider reducing 2-qubit gate count to improve fidelity.'}`,
  };
}

// IBM Heron/Eagle backends report T1/T2 in µs but some older backends use ms.
// Heuristic: if t1 < 1 it's probably seconds, scale accordingly.
function normalizeT(value: number): number {
  if (value < 1) return value * 1_000_000; // seconds → µs
  if (value < 1000) return value;           // already µs
  return value / 1000;                      // ms → µs
}

// --- Public API ------------------------------------------------------------

export interface AnalysisResult {
  findings: Finding[];
  parsed: ParsedCircuit;
  gateCount: number;
  estimatedDepth: number;
  isAerOnly: boolean;
}

export function analyzeCircuit(
  qasm: string,
  backend: IBMBackend | null,
): AnalysisResult {
  const parsed = parseQasm(qasm);

  // Normalize T1/T2 units if backend present
  const normalizedBackend = backend
    ? { ...backend, t1: normalizeT(backend.t1), t2: normalizeT(backend.t2) }
    : null;

  const findings: Finding[] = [];
  const isAerOnly = normalizedBackend === null;

  // Always-on checks
  const empty = checkEmpty(parsed);
  if (empty) findings.push(empty);

  const noMeasure = checkNoMeasure(parsed);
  if (noMeasure) findings.push(noMeasure);

  // IBM-specific checks
  if (normalizedBackend) {
    const overflow = checkQubitOverflow(parsed, normalizedBackend);
    if (overflow) findings.push(overflow);

    const basis = checkBasisGates(parsed, normalizedBackend);
    if (basis) findings.push(basis);

    const coupling = checkCouplingMap(parsed, normalizedBackend);
    if (coupling) findings.push(coupling);

    const decoherence = checkDecoherence(parsed, normalizedBackend);
    if (decoherence) findings.push(decoherence);
  }

  const gateCount = parsed.gates.filter((g) => g.name !== 'measure').length;
  const estimatedDepth = gateCount; // conservative proxy

  return { findings, parsed, gateCount, estimatedDepth, isAerOnly };
}

export function findingsToText(findings: Finding[]): string {
  return findings.map((f) => `[${f.severity.toUpperCase()}] ${f.title}: ${f.detail}`).join('\n');
}
