# QuIDE — Simulate Route
# python/routes/simulate.py

from fastapi import APIRouter, HTTPException
from services.qiskit_runner import SimulationRequest, SimulationResult, run_simulation
import asyncio
import concurrent.futures

router = APIRouter()
executor = concurrent.futures.ThreadPoolExecutor(max_workers=4)

@router.post("", response_model=SimulationResult)
async def simulate(req: SimulationRequest):
    """
    Run a Qiskit simulation from QASM input.
    Runs in a thread pool to avoid blocking the async event loop.
    """
    try:
        loop = asyncio.get_event_loop()
        result = await asyncio.wait_for(
            loop.run_in_executor(executor, run_simulation, req),
            timeout=30.0,
        )
        return result
    except asyncio.TimeoutError:
        raise HTTPException(status_code=408, detail="Simulation timed out (30s limit)")
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")
