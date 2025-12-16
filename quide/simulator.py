from qiskit import QuantumCircuit
from qiskit_aer import Aer
from qiskit import transpile
from .circuit import Circuit

class Simulator:
    def __init__(self):
        self.backend = Aer.get_backend('qasm_simulator')

    def run(self, circuit: Circuit, shots=1024):
        # Convert QuIDE circuit to Qiskit circuit
        num_qubits = 0
        for _, qubits in circuit.gates:
            for q in qubits:
                num_qubits = max(num_qubits, q + 1)

        qc = QuantumCircuit(num_qubits, num_qubits)

        for gate_name, qubits in circuit.gates:
            if gate_name == 'h':
                qc.h(qubits[0])
            elif gate_name == 'cx':
                qc.cx(qubits[0], qubits[1])

        qc.measure(range(num_qubits), range(num_qubits))

        # New Qiskit execution flow
        transpiled_qc = transpile(qc, self.backend)
        job = self.backend.run(transpiled_qc, shots=shots)
        result = job.result()
        return result.get_counts(qc)
