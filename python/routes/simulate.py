# QuIDE — Simulate Route
# python/routes/simulate.py

from fastapi import APIRouter, HTTPException
from services.qiskit_runner import SimulationRequest, SimulationResult, run_simulation
from services.ibm_runner import ibm_runner
import asyncio
import concurrent.futures

router = APIRouter()
executor = concurrent.futures.ThreadPoolExecutor(max_workers=4)

async def run_ibm_simulation(req: SimulationRequest) -> SimulationResult:
    """
    Run quantum circuit on IBM hardware.
    Requires IBM API key and backend configuration in the request.
    """
    # Validate IBM-specific fields
    if not req.ibm_api_key:
        raise ValueError("IBM API key is required for hardware execution")
    if not req.ibm_backend_name:
        raise ValueError("IBM backend name is required")
    if not req.ibm_coupling_map:
        raise ValueError("IBM coupling map is required")
    if not req.ibm_basis_gates:
        raise ValueError("IBM basis gates are required")

    # Call IBM runner
    result = await ibm_runner.run_on_hardware(
        qasm=req.qasm,
        backend_name=req.ibm_backend_name,
        api_key=req.ibm_api_key,
        shots=req.shots,
        coupling_map=req.ibm_coupling_map,
        basis_gates=req.ibm_basis_gates,
        region=req.ibm_region,
        instance_crn=req.ibm_instance_crn,
    )

    # Convert IBM result to SimulationResult format
    return SimulationResult(
        counts=result["counts"],
        statevector=None,  # IBM hardware doesn't return statevector
        shots=result["shots"],
        runtime_ms=result["runtime_ms"],
        backend=result["backend"],
        num_qubits=result["num_qubits"],
        gate_count=result["gate_count"],
        backend_type="ibm",
        ibm_job_id=result["job_id"],
        queue_time_ms=result["queue_time_ms"],
        transpiled_depth=result["transpiled_depth"],
        transpiled_gate_count=result["transpiled_gate_count"],
    )


@router.post("", response_model=SimulationResult)
async def simulate(req: SimulationRequest):
    """
    Run a quantum circuit simulation or hardware execution.

    Routes to either:
    - Qiskit Aer simulation (backend_type = "aer")
    - IBM Quantum hardware (backend_type = "ibm")
    """
    try:
        # Route based on backend type
        if req.backend_type == "ibm":
            # IBM hardware execution (already async)
            result = await asyncio.wait_for(
                run_ibm_simulation(req),
                timeout=330.0,  # 5.5 minutes (IBM has 5-minute internal timeout)
            )
        else:
            # Aer simulation (sync, run in thread pool)
            loop = asyncio.get_event_loop()
            result = await asyncio.wait_for(
                loop.run_in_executor(executor, run_simulation, req),
                timeout=30.0,
            )
        return result
    except asyncio.TimeoutError:
        if req.backend_type == "ibm":
            raise HTTPException(
                status_code=408,
                detail="IBM job timed out. Queue may be busy. Try again later."
            )
        raise HTTPException(status_code=408, detail="Simulation timed out (30s limit)")
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Execution error: {str(e)}")
