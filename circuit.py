from qiskit import QuantumCircuit as QiskitCircuit

class QuantumCircuit:
    def __init__(self, num_qubits):
        self.num_qubits = num_qubits
        self.qc = QiskitCircuit(num_qubits)

    def apply_gate(self, gate, qubit_index):
        if gate == "x":
            self.qc.x(qubit_index)
        elif gate == "h":
            self.qc.h(qubit_index)
        elif gate == "z":
            self.qc.z(qubit_index)
        elif gate == "y":
            self.qc.y(qubit_index)
        elif gate == "s":
            self.qc.s(qubit_index)
        elif gate == "t":
            self.qc.t(qubit_index)
        else:
            raise ValueError(f"Unsupported gate: {gate}")

    def measure_all(self):
        self.qc.measure_all()

    def draw(self):
        return self.qc.draw("text")

    def get_circuit(self):
        return self.qc

