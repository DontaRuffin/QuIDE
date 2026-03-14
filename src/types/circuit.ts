// QuIDE — Circuit Type Definitions
// src/types/circuit.ts

export type GateType =
  | 'h' | 'x' | 'y' | 'z'
  | 's' | 'sdg' | 't' | 'tdg'
  | 'cx' | 'ccx' | 'swap'
  | 'rx' | 'ry' | 'rz'
  | 'measure' | 'barrier' | 'reset';

export interface Gate {
  id: string;
  type: GateType;
  qubit: number;
  column: number;
  /** For two-qubit gates like CNOT — target qubit */
  targetQubit?: number;
  /** For rotation gates */
  angle?: number;
  label?: string;
}

export interface CircuitMeta {
  id?: string;
  name: string;
  numQubits: number;
  numClbits: number;
  createdAt?: string;
  updatedAt?: string;
  isPublic?: boolean;
  shareSlug?: string;
  userId?: string;
}

export interface Circuit extends CircuitMeta {
  gates: Gate[];
  /** OpenQASM 2.0 source of truth — always kept in sync with gates */
  qasm: string;
}

export interface CircuitTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  numQubits: number;
  qasm: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export type TemplateCategory =
  | 'entanglement'
  | 'superposition'
  | 'algorithms'
  | 'error-correction'
  | 'vqe'
  | 'teleportation';

export interface SavedCircuit extends Circuit {
  id: string;
  userId: string;
  gateCount: number;
  createdAt: string;
  updatedAt: string;
}
