# QuIDE — IBM Quantum Platform Routes
# python/routes/ibm.py

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, List
from qiskit import QuantumCircuit
from services.ibm_proxy import ibm_proxy, IBMBackendInfo
from services.cost_estimator import cost_estimator

router = APIRouter()

class IBMValidateRequest(BaseModel):
    """Request to validate IBM API key"""
    region: str = "us-east"  # "us-east" or "eu-de"

class IBMBackendsRequest(BaseModel):
    """Request to list IBM backends"""
    region: str = "us-east"
    instance_crn: Optional[str] = None

class EstimateCostRequest(BaseModel):
    """Request to estimate job cost"""
    qasm: str
    backend_name: str
    shots: int = 1024
    backend_t1: Optional[float] = None
    backend_t2: Optional[float] = None

@router.post("/validate")
async def validate_ibm_key(
    req: IBMValidateRequest,
    x_api_key: str = Header(..., alias="x-api-key")
):
    """
    Validate IBM API key and region.

    User's IBM API key is passed in x-api-key header.
    Returns validation status and available backend count.
    """
    if not x_api_key or len(x_api_key) < 20:
        raise HTTPException(status_code=400, detail="Invalid IBM API key format")

    try:
        result = await ibm_proxy.validate_connection(x_api_key, req.region)

        if not result["valid"]:
            raise HTTPException(
                status_code=401,
                detail=result.get("error", "IBM authentication failed")
            )

        return {
            "valid": True,
            "backend_count": result["backend_count"],
            "region": result["region"],
            "message": f"Successfully connected to IBM Quantum ({result['backend_count']} backends available)",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation error: {str(e)}")


@router.post("/backends", response_model=List[IBMBackendInfo])
async def list_ibm_backends(
    req: IBMBackendsRequest,
    x_api_key: str = Header(..., alias="x-api-key")
):
    """
    List available IBM Quantum backends.

    User's IBM API key is passed in x-api-key header.
    Returns list of backends with metadata (qubits, status, coupling map, etc.).
    """
    if not x_api_key or len(x_api_key) < 20:
        raise HTTPException(status_code=400, detail="Invalid IBM API key format")

    try:
        backends = await ibm_proxy.list_backends(
            x_api_key,
            req.region,
            req.instance_crn
        )

        return backends

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list IBM backends: {str(e)}"
        )


@router.post("/estimate-cost")
async def estimate_ibm_cost(req: EstimateCostRequest):
    """
    Estimate cost for running circuit on IBM hardware.

    No API key required (cost estimation is public).
    Returns estimated USD cost, QPU time, and warnings.
    """
    try:
        # Parse QASM to circuit
        circuit = QuantumCircuit.from_qasm_str(req.qasm)

        # Estimate cost
        estimate = cost_estimator.estimate_job_cost(
            circuit,
            req.shots,
            req.backend_name,
            req.backend_t1,
            req.backend_t2,
        )

        return estimate

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Cost estimation failed: {str(e)}"
        )
