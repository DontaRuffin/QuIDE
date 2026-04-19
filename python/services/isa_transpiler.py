# QuIDE — ISA Circuit Transpilation Service
# python/services/isa_transpiler.py

from qiskit import QuantumCircuit, transpile
from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager
from typing import List, Dict, Any, Optional

class ISATranspiler:
    """
    Handles ISA (Instruction Set Architecture) circuit transpilation.

    IBM Quantum Platform requires ISA-transpiled circuits since March 2024:
    - Transpile to backend's native gate set (basis_gates)
    - Respect coupling map (insert SWAPs for non-adjacent qubits)
    - Optimize for gate count and circuit depth
    """

    def transpile_for_backend(
        self,
        circuit: QuantumCircuit,
        coupling_map: List[List[int]],
        basis_gates: List[str],
        optimization_level: int = 2,
    ) -> QuantumCircuit:
        """
        Transpile circuit to ISA format for given IBM backend.

        Args:
            circuit: Qiskit QuantumCircuit to transpile
            coupling_map: Backend's qubit connectivity [[q0, q1], [q1, q2], ...]
            basis_gates: Backend's native gates ["rz", "sx", "cx", ...]
            optimization_level: 0-3 (higher = more optimization, slower)

        Returns:
            Transpiled QuantumCircuit ready for IBM backend

        Raises:
            ValueError: If transpilation fails
        """
        try:
            # Use Qiskit's preset pass manager for ISA transpilation
            pass_manager = generate_preset_pass_manager(
                optimization_level=optimization_level,
                coupling_map=coupling_map,
                basis_gates=basis_gates,
                seed_transpiler=42,  # Reproducible results
            )

            transpiled = pass_manager.run(circuit)

            return transpiled

        except Exception as e:
            raise ValueError(f"Circuit transpilation failed: {str(e)}")

    def estimate_transpilation_overhead(
        self,
        circuit: QuantumCircuit,
        coupling_map: List[List[int]],
        basis_gates: List[str],
    ) -> Dict[str, Any]:
        """
        Estimate transpilation overhead (SWAPs, depth increase).
        Used for cost estimation and user warnings.

        Args:
            circuit: Original circuit
            coupling_map: Backend coupling map
            basis_gates: Backend basis gates

        Returns:
            Dict with transpilation metrics:
            - original_depth: Original circuit depth
            - transpiled_depth: Depth after transpilation
            - swap_count: Number of SWAP gates inserted
            - gate_count: Total gates after transpilation
            - depth_increase_pct: Percentage increase in depth
        """
        try:
            # Quick transpilation with routing
            transpiled = transpile(
                circuit,
                coupling_map=coupling_map,
                basis_gates=basis_gates,
                optimization_level=1,  # Fast estimate
            )

            original_depth = circuit.depth()
            transpiled_depth = transpiled.depth()
            original_gate_count = len([op for op in circuit.data if op.operation.name not in ('barrier', 'measure')])
            transpiled_gate_count = len([op for op in transpiled.data if op.operation.name not in ('barrier', 'measure')])

            # Count SWAP gates
            swap_count = sum(1 for gate in transpiled.data if gate.operation.name == "swap")

            # Calculate depth increase
            depth_increase_pct = 0.0
            if original_depth > 0:
                depth_increase_pct = ((transpiled_depth - original_depth) / original_depth) * 100

            return {
                "original_depth": original_depth,
                "transpiled_depth": transpiled_depth,
                "original_gate_count": original_gate_count,
                "transpiled_gate_count": transpiled_gate_count,
                "swap_count": swap_count,
                "depth_increase_pct": round(depth_increase_pct, 1),
                "warning": self._generate_overhead_warning(swap_count, depth_increase_pct),
            }

        except Exception as e:
            return {
                "error": str(e),
                "warning": "Unable to estimate transpilation overhead",
            }

    def _generate_overhead_warning(self, swap_count: int, depth_increase_pct: float) -> Optional[str]:
        """Generate user-friendly warning about transpilation overhead"""
        warnings = []

        if swap_count > 5:
            warnings.append(f"{swap_count} SWAP gates will be added (decreases fidelity)")

        if depth_increase_pct > 50:
            warnings.append(f"Circuit depth will increase by {depth_increase_pct:.0f}%")

        return " | ".join(warnings) if warnings else None


# Global singleton instance
isa_transpiler = ISATranspiler()
