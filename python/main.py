# QuIDE — FastAPI Simulation Service
# python/main.py

from fastapi import FastAPI, HTTPException, Security, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.api_key import APIKeyHeader
from contextlib import asynccontextmanager
import os
import time

from routes.simulate import router as simulate_router

API_KEY = os.getenv("SERVICE_API_KEY", "dev-key-change-in-prod")
api_key_header = APIKeyHeader(name="X-Service-Key", auto_error=False)

ALLOWED_ORIGINS = [
    "https://quide.dev",
    "https://www.quide.dev",
    "https://*.vercel.app",
    "http://localhost:3000",
]

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("QuIDE Simulation Service starting...")
    try:
        from qiskit import QuantumCircuit
        from qiskit_aer import AerSimulator
        _ = AerSimulator()
        print("Qiskit Aer initialized")
    except Exception as e:
        print(f"Qiskit init warning: {e}")
    yield
    print("QuIDE Simulation Service shutting down")


app = FastAPI(
    title="QuIDE Simulation Service",
    description="Qiskit Aer simulation backend for QuIDE",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


async def verify_api_key(key: str = Security(api_key_header)):
    if key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid service key")
    return key


@app.get("/health")
async def health():
    """Railway health check endpoint."""
    return {"status": "ok", "service": "quide-simulation", "timestamp": time.time()}


@app.get("/backends")
async def list_backends(_key: str = Depends(verify_api_key)):
    """Return available simulation backends."""
    return {
        "backends": [
            {"id": "aer_simulator", "name": "Aer Simulator (statevector)", "description": "Exact statevector simulation, up to 12 qubits", "maxQubits": 12},
            {"id": "aer_simulator_shot", "name": "Aer Simulator (shot-based)", "description": "Shot-based sampling, up to 20 qubits", "maxQubits": 20},
        ]
    }


app.include_router(
    simulate_router,
    prefix="/simulate",
    dependencies=[Depends(verify_api_key)],
)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("ENVIRONMENT") != "production",
    )
