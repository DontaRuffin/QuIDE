// QuIDE — IBM Quantum Platform API Client
// src/lib/ibmApi.ts

export interface IBMBackend {
  name: string;
  num_qubits: number;
  status: string;
  pending_jobs: number;
  backend_version: string;
  max_shots: number;
  coupling_map: number[][];
  basis_gates: string[];
  t1: number;
  t2: number;
  is_simulator: boolean;
}

export interface CostEstimate {
  estimated_cost_usd: number;
  qpu_time_minutes: number;
  circuit_depth: number;
  shots: number;
  is_free_tier: boolean;
  backend_name: string;
  decoherence_warning: boolean;
  warning_message: string | null;
}

const getBackendUrl = () => {
  return process.env.NEXT_PUBLIC_SIMULATION_URL || 'http://localhost:8000';
};

/**
 * List available IBM Quantum backends
 */
export async function listIBMBackends(
  apiKey: string,
  region: string,
  instanceCrn?: string
): Promise<IBMBackend[]> {
  const response = await fetch(`${getBackendUrl()}/ibm/backends`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey.trim(),
    },
    body: JSON.stringify({
      region,
      instance_crn: instanceCrn || undefined,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to list IBM backends');
  }

  return response.json();
}

/**
 * Estimate cost for running circuit on IBM hardware
 */
export async function estimateIBMCost(
  qasm: string,
  backendName: string,
  shots: number,
  backendT1?: number,
  backendT2?: number
): Promise<CostEstimate> {
  const response = await fetch(`${getBackendUrl()}/ibm/estimate-cost`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      qasm,
      backend_name: backendName,
      shots,
      backend_t1: backendT1,
      backend_t2: backendT2,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to estimate cost');
  }

  return response.json();
}

/**
 * Run circuit on IBM hardware via QuIDE backend proxy
 */
export async function runOnIBMHardware(
  qasm: string,
  backend: IBMBackend,
  shots: number,
  apiKey: string,
  region: string,
  instanceCrn?: string,
  serviceKey?: string
): Promise<any> {
  const response = await fetch(`${getBackendUrl()}/simulate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Service-Key': serviceKey || 'dev-key-change-in-prod',
    },
    body: JSON.stringify({
      qasm,
      shots,
      backend: backend.name,
      backend_type: 'ibm',
      ibm_api_key: apiKey.trim(),
      ibm_backend_name: backend.name,
      ibm_coupling_map: backend.coupling_map,
      ibm_basis_gates: backend.basis_gates,
      ibm_region: region,
      ibm_instance_crn: instanceCrn,
      include_statevector: false,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'IBM hardware execution failed');
  }

  return response.json();
}
