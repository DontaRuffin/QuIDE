# QuIDE — Qiskit Simulation Runner
# python/services/qiskit_runner.py

from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator
from qiskit_aer.primitives import Sampler
from pydantic import BaseModel
from typing import Optional, Dict, List
import time
import re

class SimulationRequest(BaseModel):
    qasm: str
    shots: int = 1024
    backend: str = "aer_simulator"
    include_statevector: bool = True

    # IBM-specific fields (optional, required when backend_type = "ibm")
    backend_type: str = "aer"  # "aer" | "ibm"
    ibm_api_key: Optional[str] = None
    ibm_backend_name: Optional[str] = None
    ibm_coupling_map: Optional[List[List[int]]] = None
    ibm_basis_gates: Optional[List[str]] = None
    ibm_region: str = "us-east"
    ibm_instance_crn: Optional[str] = None


class SimulationResult(BaseModel):
    counts: Dict[str, int]
    statevector: Optional[List[List[float]]]
    shots: int
    runtime_ms: int
    backend: str
    num_qubits: int
    gate_count: int

    # IBM-specific fields (present when backend_type = "ibm")
    backend_type: str = "aer"
    ibm_job_id: Optional[str] = None
    queue_time_ms: Optional[int] = None
    transpiled_depth: Optional[int] = None
    transpiled_gate_count: Optional[int] = None


MAX_QUBITS_STATEVECTOR = 12
MAX_QUBITS_SHOT = 20
MAX_GATES = 500
TIMEOUT_SECONDS = 30


def run_simulation(req: SimulationRequest) -> SimulationResult:
    """
    Parse QASM, validate, run Qiskit Aer simulation, return results.
    Raises ValueError for invalid QASM or limit violations.
    """
    start = time.time()

    try:
        circuit = QuantumCircuit.from_qasm_str(req.qasm)
    except Exception as e:
        raise ValueError(f"Invalid QASM: {str(e)}")

    num_qubits = circuit.num_qubits
    gate_count = len([op for op in circuit.data if op.operation.name not in ('barrier', 'snapshot')])

    if num_qubits > MAX_QUBITS_SHOT:
        raise ValueError(f"Circuit has {num_qubits} qubits. Maximum supported: {MAX_QUBITS_SHOT}")

    if gate_count > MAX_GATES:
        raise ValueError(f"Circuit has {gate_count} gates. Maximum supported: {MAX_GATES}")

    use_statevector = (
        req.include_statevector
        and num_qubits <= MAX_QUBITS_STATEVECTOR
        and circuit.num_clbits == 0
    )

    counts: Dict[str, int] = {}
    statevector_data: Optional[List[List[float]]] = None

    if use_statevector:
        sv_circuit = circuit.copy()
        sv_circuit.remove_final_measurements(inplace=False)
        measured_circuit = circuit.copy()
        if measured_circuit.num_clbits == 0:
            measured_circuit.measure_all()
        simulator = AerSimulator(method='statevector')
        transpiled = transpile(measured_circuit, simulator)
        job = simulator.run(transpiled, shots=req.shots)
        result = job.result()
        raw_counts = result.get_counts()
        counts = {k.replace(' ', ''): v for k, v in raw_counts.items()}
        sv_sim = AerSimulator(method='statevector')
        sv_job = sv_sim.run(transpile(sv_circuit, sv_sim), shots=1)
        sv_result = sv_job.result()
        try:
            sv = sv_result.get_statevector()
            statevector_data = [[float(amp.real), float(amp.imag)] for amp in sv]
        except Exception:
            statevector_data = None
    else:
        measured_circuit = circuit.copy()
        measured_circuit.measure_all()
        simulator = AerSimulator()
        transpiled = transpile(measured_circuit, simulator)
        job = simulator.run(transpiled, shots=req.shots)
        result = job.result()
        raw_counts = result.get_counts()
        counts = {k.replace(' ', ''): v for k, v in raw_counts.items()}

    runtime_ms = int((time.time() - start) * 1000)

    return SimulationResult(
        counts=counts,
        statevector=statevector_data,
        shots=req.shots,
        runtime_ms=runtime_ms,
        backend=req.backend,
        num_qubits=num_qubits,
        gate_count=gate_count,
    )
