class Circuit:
    def __init__(self):
        self.gates = []

    def add_gate(self, gate_name, qubits):
        self.gates.append((gate_name, qubits))

    def h(self, qubit):
        self.add_gate('h', [qubit])

    def cx(self, control, target):
        self.add_gate('cx', [control, target])
