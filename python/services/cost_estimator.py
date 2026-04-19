# QuIDE — IBM Quantum Hardware Cost Estimation Service
# python/services/cost_estimator.py

from qiskit import QuantumCircuit
from typing import Dict, Any, Optional

class CostEstimator:
    """
    Estimates IBM Quantum hardware job cost.

    Pricing (as of 2026):
    - Pay-As-You-Go: ~$96/minute of QPU time
    - Free tier: ibm_kingston has no charge
    - QPU time = circuit execution time on quantum hardware

    Estimation formula:
    - Gate time ≈ 100ns (average, varies by gate and backend)
    - Circuit time = depth * gate_time
    - QPU time = circuit_time * shots
    - Cost = QPU_time_minutes * $96
    """

    PRICE_PER_MINUTE_USD = 96.0
    AVG_GATE_TIME_US = 0.1  # 100 nanoseconds in microseconds

    def estimate_job_cost(
        self,
        circuit: QuantumCircuit,
        shots: int,
        backend_name: str,
        backend_t1: Optional[float] = None,
        backend_t2: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Estimate cost in USD for running job on IBM hardware.

        Args:
            circuit: Qiskit QuantumCircuit
            shots: Number of measurement shots
            backend_name: IBM backend name (e.g., "ibm_kingston")
            backend_t1: T1 decoherence time in microseconds (optional)
            backend_t2: T2 decoherence time in microseconds (optional)

        Returns:
            Dict with cost estimation:
            - estimated_cost_usd: Estimated cost in USD
            - qpu_time_minutes: Estimated QPU time
            - circuit_depth: Circuit depth
            - shots: Number of shots
            - is_free_tier: Whether backend is free
            - decoherence_warning: Warning if circuit approaches T2 limit
            - warning_message: Human-readable warning (if any)
        """
        # Free tier backends
        FREE_TIER_BACKENDS = {"ibm_kingston"}
        is_free_tier = backend_name in FREE_TIER_BACKENDS

        # Calculate circuit metrics
        depth = circuit.depth()

        # Estimate circuit execution time
        # Total time = depth * avg_gate_time
        total_circuit_time_us = depth * self.AVG_GATE_TIME_US

        # Total QPU time for all shots
        # Note: Shots are typically batched, but we'll estimate conservatively
        total_qpu_time_us = total_circuit_time_us * shots

        # Convert to minutes for pricing
        total_qpu_time_minutes = total_qpu_time_us / 1_000_000 / 60

        # Calculate cost (free tier = $0)
        estimated_cost_usd = 0.0 if is_free_tier else (total_qpu_time_minutes * self.PRICE_PER_MINUTE_USD)

        # Check decoherence limits
        decoherence_warning = False
        warning_message = None

        if backend_t2 and total_circuit_time_us > (backend_t2 * 0.5):
            decoherence_warning = True
            warning_message = f"Circuit depth approaches T2 decoherence time ({backend_t2:.1f}µs). Results may be degraded."

        # Additional warnings for free tier
        if is_free_tier:
            warning_message = "Free tier: ibm_kingston. No charge for this job."
        elif estimated_cost_usd > 10.0:
            warning_message = f"⚠️ High cost estimate: ${estimated_cost_usd:.2f}. Consider reducing shots or circuit depth."

        return {
            "estimated_cost_usd": round(estimated_cost_usd, 4),
            "qpu_time_minutes": round(total_qpu_time_minutes, 6),
            "circuit_depth": depth,
            "shots": shots,
            "is_free_tier": is_free_tier,
            "backend_name": backend_name,
            "decoherence_warning": decoherence_warning,
            "warning_message": warning_message,
        }

    def get_pricing_info(self) -> Dict[str, Any]:
        """Get current IBM Quantum pricing information"""
        return {
            "pay_as_you_go_per_minute": self.PRICE_PER_MINUTE_USD,
            "currency": "USD",
            "free_tier_backends": ["ibm_kingston"],
            "note": "Pricing as of 2026. IBM charges may vary. Free tier includes ibm_kingston (127 qubits).",
        }


# Global singleton instance
cost_estimator = CostEstimator()
