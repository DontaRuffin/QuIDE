# QuIDE — IBM Quantum Hardware Job Submission Service
# python/services/ibm_runner.py

from qiskit import QuantumCircuit
from qiskit_ibm_runtime import QiskitRuntimeService, SamplerV2
from typing import Dict, Any, List, Optional
from services.isa_transpiler import isa_transpiler
import time

class IBMJobRunner:
    """
    Handles IBM Quantum hardware job submission using V2 primitives.

    Flow:
    1. Parse QASM to QuantumCircuit
    2. Transpile to ISA format for backend
    3. Submit job using SamplerV2 (V1 retired August 2024)
    4. Poll for completion (timeout: 5 minutes)
    5. Return counts + metadata

    Uses IBM Cloud IAM authentication (bearer token).
    """

    def __init__(self):
        self._service_cache = {}  # Cache QiskitRuntimeService instances

    async def run_on_hardware(
        self,
        qasm: str,
        backend_name: str,
        api_key: str,
        shots: int,
        coupling_map: List[List[int]],
        basis_gates: List[str],
        region: str = "us-east",
        instance_crn: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Execute circuit on IBM Quantum hardware.

        Args:
            qasm: OpenQASM 2.0 circuit
            backend_name: IBM backend (e.g., "ibm_kingston")
            api_key: IBM API key
            shots: Number of measurement shots
            coupling_map: Backend coupling map
            basis_gates: Backend basis gates
            region: IBM region ("us-east" or "eu-de")
            instance_crn: IBM Cloud Instance CRN (optional)

        Returns:
            Dict with results:
            - counts: Measurement results {state: count}
            - shots: Number of shots
            - backend: Backend name
            - job_id: IBM job ID
            - runtime_ms: Execution time
            - queue_time_ms: Queue wait time
            - transpiled_depth: Circuit depth after transpilation
            - transpiled_gate_count: Gate count after transpilation

        Raises:
            ValueError: If job submission fails
            TimeoutError: If job exceeds 5-minute timeout
        """
        start_time = time.time()

        try:
            # Parse QASM to QuantumCircuit
            circuit = QuantumCircuit.from_qasm_str(qasm)

            # Transpile to ISA format
            transpiled = isa_transpiler.transpile_for_backend(
                circuit,
                coupling_map,
                basis_gates,
                optimization_level=2,
            )

            transpiled_depth = transpiled.depth()
            transpiled_gate_count = len([
                op for op in transpiled.data
                if op.operation.name not in ('barrier', 'measure')
            ])

            # Initialize Qiskit Runtime Service
            # Note: We pass the API key directly (token will be auto-generated)
            service = QiskitRuntimeService(
                channel="ibm_cloud",
                token=api_key,  # API key is used as token (runtime will exchange it)
                instance=instance_crn,
            )

            # Get backend
            backend = service.backend(backend_name)

            # Submit job with SamplerV2 (without Session for Open Plan compatibility)
            # Note: Session mode is only available for Premium/Flex plans, not Open Plan
            # Pass backend as positional argument to SamplerV2
            sampler = SamplerV2(backend)

            # Submit job
            job = sampler.run([transpiled], shots=shots)

            # Wait for result (timeout: 5 minutes)
            result = job.result(timeout=300)

            # Extract counts from result
            # SamplerV2 returns PUB (Primitive Unified Bloc) results
            pub_result = result[0]

            # Get counts from data
            counts_data = pub_result.data.meas.get_counts()

            # Format counts as dict
            counts = {state: int(count) for state, count in counts_data.items()}

            # Get job metadata
            job_id = job.job_id()

            # Calculate timing
            end_time = time.time()
            total_time_ms = int((end_time - start_time) * 1000)

            # Try to get queue time from job metrics
            queue_time_ms = 0
            try:
                metrics = job.metrics()
                if metrics and "timestamps" in metrics:
                    timestamps = metrics["timestamps"]
                    if "running" in timestamps and "queued" in timestamps:
                        queue_time_sec = timestamps["running"] - timestamps["queued"]
                        queue_time_ms = int(queue_time_sec * 1000)
            except:
                pass  # Queue time not critical

            runtime_ms = total_time_ms - queue_time_ms

            return {
                "counts": counts,
                "shots": shots,
                "backend": backend_name,
                "job_id": job_id,
                "runtime_ms": runtime_ms,
                "queue_time_ms": queue_time_ms,
                "transpiled_depth": transpiled_depth,
                "transpiled_gate_count": transpiled_gate_count,
                "num_qubits": circuit.num_qubits,
                "gate_count": len([op for op in circuit.data if op.operation.name not in ('barrier', 'measure')]),
            }

        except TimeoutError:
            raise TimeoutError("IBM job exceeded 5-minute timeout. Queue may be busy.")
        except Exception as e:
            raise ValueError(f"IBM job submission failed: {str(e)}")


# Global singleton instance
ibm_runner = IBMJobRunner()
