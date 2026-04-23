// QuIDE — Beginner Onboarding Modal
// src/components/ide/OnboardingModal.tsx

'use client';

import { useState, useEffect } from 'react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const totalSteps = 4;

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        handleSkip();
      } else if (e.key === 'ArrowRight' && currentStep < totalSteps - 1) {
        handleNext();
      } else if (e.key === 'ArrowLeft' && currentStep > 0) {
        handlePrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep]);

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
    onClose();
  };

  const handleComplete = () => {
    onComplete();
    onClose();
  };

  // Reset to step 0 when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black flex items-center justify-center z-50"
      onClick={handleSkip}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-lg max-w-3xl w-full mx-4 text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bar */}
        <div className="h-1 bg-gray-800">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {/* Content Area */}
        <div className="p-8 min-h-[500px] max-h-[80vh] overflow-y-auto">
          {currentStep === 0 && <Step1Welcome />}
          {currentStep === 1 && <Step2QuantumBasics />}
          {currentStep === 2 && <Step3InterfaceTour />}
          {currentStep === 3 && <Step4ExampleCircuit />}
        </div>

        {/* Navigation Footer */}
        <div className="border-t border-gray-700 p-6 flex justify-between items-center bg-gray-800/50">
          <div className="text-sm text-gray-400">
            Step {currentStep + 1} of {totalSteps}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Skip
            </button>

            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors"
              >
                Previous
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium transition-colors"
            >
              {currentStep === totalSteps - 1 ? "Got it, let's build!" : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 1: Welcome & Value Proposition
function Step1Welcome() {
  return (
    <div className="flex flex-col items-center text-center space-y-6">
      <div className="text-5xl mb-4">⬡</div>
      <h1 className="text-4xl font-bold text-blue-400">Welcome to QuIDE</h1>
      <p className="text-xl text-gray-300">
        Quantum Integrated Development Environment
      </p>

      <div className="max-w-2xl space-y-4 text-left mt-8">
        <h2 className="text-2xl font-semibold mb-4">What makes QuIDE different?</h2>

        <div className="flex items-start gap-3">
          <div className="text-2xl">🧠</div>
          <div>
            <h3 className="font-semibold text-lg">Visual-Circuit-Aware AI</h3>
            <p className="text-gray-400">
              Our AI explains what your circuit <em>does</em> visually, not just the code.
              Get gate-by-gate breakdowns and state evolution analysis.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="text-2xl">🌐</div>
          <div>
            <h3 className="font-semibold text-lg">Browser-Native</h3>
            <p className="text-gray-400">
              No installation, no environment setup. Start building quantum circuits instantly.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="text-2xl">⚛️</div>
          <div>
            <h3 className="font-semibold text-lg">Qiskit-First</h3>
            <p className="text-gray-400">
              Built on IBM&apos;s Qiskit framework. Learn industry-standard quantum programming.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="text-2xl">💰</div>
          <div>
            <h3 className="font-semibold text-lg">Prosumer Pricing</h3>
            <p className="text-gray-400">
              Professional tools without $30K/seat enterprise costs. Perfect for learners and researchers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 2: Quantum Basics
function Step2QuantumBasics() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-center mb-8">Quantum Computing 101</h1>

      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
          <h3 className="text-xl font-semibold text-blue-400 mb-3">Qubits</h3>
          <p className="text-gray-300 mb-2">
            Unlike classical bits (0 or 1), qubits can exist in <strong>superposition</strong> -
            simultaneously representing both 0 and 1 until measured.
          </p>
          <div className="bg-gray-900 rounded p-3 mt-3 font-mono text-sm text-center">
            Classical bit: <span className="text-red-400">0</span> OR <span className="text-green-400">1</span>
            <br />
            Qubit: <span className="text-blue-400">|0⟩ AND |1⟩</span> (in superposition)
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
          <h3 className="text-xl font-semibold text-purple-400 mb-3">Quantum Gates</h3>
          <p className="text-gray-300 mb-3">
            Gates manipulate qubits, like logic gates in classical computing.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3">
              <div className="bg-blue-900 border border-blue-500 px-3 py-1 rounded font-mono font-bold">H</div>
              <span className="text-gray-300">Hadamard - Creates superposition</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-red-900 border border-red-500 px-3 py-1 rounded font-mono font-bold">X</div>
              <span className="text-gray-300">Pauli-X - Quantum NOT gate (flips qubit)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-blue-900 border border-blue-500 px-2 py-1 rounded font-mono font-bold">CX</div>
              <span className="text-gray-300">CNOT - Creates entanglement between qubits</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
          <h3 className="text-xl font-semibold text-green-400 mb-3">Measurement</h3>
          <p className="text-gray-300">
            Measuring a qubit <strong>collapses</strong> its superposition to either 0 or 1.
            The result is probabilistic based on the quantum state.
          </p>
        </div>

        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 text-center">
          <p className="text-blue-200">
            💡 <strong>Why it matters:</strong> Quantum computers can solve certain problems
            (like factoring, optimization, simulation) exponentially faster than classical computers.
          </p>
        </div>
      </div>
    </div>
  );
}

// Step 3: Interface Tour
function Step3InterfaceTour() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-center mb-6">Your Quantum Workspace</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
        <div className="bg-gray-800 border border-blue-500 rounded-lg p-5 relative">
          <div className="absolute -top-3 -left-3 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">1</div>
          <h3 className="text-lg font-semibold text-blue-400 mb-2">Gate Toolbar (Left)</h3>
          <p className="text-gray-300 text-sm">
            Drag quantum gates from here onto the circuit canvas. Gates are organized by type:
            Single-Qubit, Two-Qubit, and Measurement.
          </p>
        </div>

        <div className="bg-gray-800 border border-purple-500 rounded-lg p-5 relative">
          <div className="absolute -top-3 -left-3 bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">2</div>
          <h3 className="text-lg font-semibold text-purple-400 mb-2">Circuit Canvas (Center)</h3>
          <p className="text-gray-300 text-sm">
            Visual representation of your quantum circuit. Drop gates here to build your algorithm.
            The circuit automatically syncs with the code panel.
          </p>
        </div>

        <div className="bg-gray-800 border border-green-500 rounded-lg p-5 relative">
          <div className="absolute -top-3 -left-3 bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">3</div>
          <h3 className="text-lg font-semibold text-green-400 mb-2">Code/Explain Panel (Right)</h3>
          <p className="text-gray-300 text-sm mb-2">
            Toggle between two views:
          </p>
          <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
            <li><strong className="text-gray-300">Code:</strong> Auto-generated QASM (Quantum Assembly)</li>
            <li><strong className="text-gray-300">Explain:</strong> AI-powered circuit breakdown</li>
          </ul>
        </div>

        <div className="bg-gray-800 border border-yellow-500 rounded-lg p-5 relative">
          <div className="absolute -top-3 -left-3 bg-yellow-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">4</div>
          <h3 className="text-lg font-semibold text-yellow-400 mb-2">Simulation Results (Bottom)</h3>
          <p className="text-gray-300 text-sm">
            After running your circuit, see measurement outcomes with probabilities.
            Shows shots, runtime, and backend info.
          </p>
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 max-w-4xl mx-auto mt-6">
        <h3 className="text-lg font-semibold text-gray-300 mb-3">Header Controls</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="font-mono text-blue-400">Backend:</span>
            <span className="text-gray-400 ml-2">Choose Aer simulator or IBM hardware</span>
          </div>
          <div>
            <span className="font-mono text-blue-400">Qubits:</span>
            <span className="text-gray-400 ml-2">Set number of qubits (1-12)</span>
          </div>
          <div>
            <span className="font-mono text-green-400">⚙ AI / ⚙ IBM:</span>
            <span className="text-gray-400 ml-2">Configure your API keys (BYOK)</span>
          </div>
          <div>
            <span className="font-mono text-green-400">▶ Simulate:</span>
            <span className="text-gray-400 ml-2">Run your quantum circuit</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 4: Example Circuit
function Step4ExampleCircuit() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-6">Your First Quantum Circuit</h1>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-center">Simple Superposition Circuit</h3>

        {/* Simple circuit diagram */}
        <div className="bg-gray-900 rounded-lg p-6 font-mono text-sm mb-6 overflow-x-auto">
          <div className="text-center">
            <pre className="text-gray-300">
{`q[0]: |0⟩ ──[H]──[M]── c[0]
              │
              └── 50% |0⟩, 50% |1⟩`}
            </pre>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
            <div>
              <h4 className="font-semibold text-blue-400">Start with |0⟩</h4>
              <p className="text-gray-400 text-sm">
                Qubit begins in the ground state (classical 0).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
            <div>
              <h4 className="font-semibold text-purple-400">Apply H gate (Hadamard)</h4>
              <p className="text-gray-400 text-sm">
                Creates equal superposition: <span className="font-mono text-blue-300">(|0⟩ + |1⟩)/√2</span>
                <br />
                Now the qubit is simultaneously 0 and 1!
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
            <div>
              <h4 className="font-semibold text-green-400">Measure qubit</h4>
              <p className="text-gray-400 text-sm">
                Collapses superposition → <strong className="text-green-300">50% chance of 0, 50% chance of 1</strong>
                <br />
                Run 1024 shots to see the probability distribution!
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-5">
        <h3 className="text-lg font-semibold text-blue-300 mb-3">Try it yourself!</h3>
        <ol className="space-y-2 text-sm text-gray-300 list-decimal list-inside">
          <li>Drag the <span className="font-mono bg-blue-900 border border-blue-500 px-2 py-0.5 rounded">H</span> gate from the left toolbar to qubit 0</li>
          <li>Drag the <span className="font-mono bg-green-900 border border-green-500 px-2 py-0.5 rounded">M</span> (Measure) gate to the same qubit</li>
          <li>Click <span className="font-mono bg-green-700 px-2 py-0.5 rounded">▶ Simulate</span> in the header</li>
          <li>Check the Results panel at the bottom - you should see roughly 50% |0⟩ and 50% |1⟩</li>
          <li>Switch to the <strong>Explain</strong> tab to see AI analysis of your circuit!</li>
        </ol>
      </div>

      <div className="text-center text-gray-400 text-sm mt-6">
        <p>Ready to build more complex circuits? Let&apos;s get started! 🚀</p>
      </div>
    </div>
  );
}
