from setuptools import setup, find_packages

setup(
    name="quide",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "qiskit",
        "qiskit-aer",
        "cirq",
        "pennylane",
    ],
    author="QuIDE Team",
    description="Quantum Integrated Development Environment",
)
