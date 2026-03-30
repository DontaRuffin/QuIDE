from quide.circuit import QuantumCircuit

qc = QuantumCircuit(2)
qc.apply_gate("h", 0)
qc.apply_gate("x", 1)
qc.measure_all()

print(qc.draw())

