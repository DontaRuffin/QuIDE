'use client';

import { useState, useEffect, useRef } from 'react';

const STEPS = [
  {
    eyebrow: 'Welcome to QuIDE',
    title: 'A quantum IDE\nthat thinks visually.',
    body: 'Build, simulate, and understand quantum circuits — entirely in your browser. No setup, no install.',
    cta: 'Get started',
    highlight: null as null | 'sidebar' | 'right' | 'top',
  },
  {
    eyebrow: 'Step 01 — Build',
    title: 'Drag gates onto\nthe wire.',
    body: 'Pick from single-qubit, two-qubit, and measurement gates in the left rail. Drop them onto a qubit line to compose your circuit.',
    cta: 'Next',
    highlight: 'sidebar' as null | 'sidebar' | 'right' | 'top',
  },
  {
    eyebrow: 'Step 02 — Read',
    title: 'See the code\nas you go.',
    body: 'Every gate you place becomes valid OpenQASM 2.0 — switch to Explain for a plain-language, gate-by-gate breakdown of what your circuit actually does.',
    cta: 'Next',
    highlight: 'right' as null | 'sidebar' | 'right' | 'top',
  },
  {
    eyebrow: 'Step 03 — Run',
    title: 'Simulate locally\nor send to IBM.',
    body: "Run on the Aer statevector simulator for instant results, or push the same circuit to real IBM Quantum hardware when you're ready.",
    cta: 'Next',
    highlight: 'top' as null | 'sidebar' | 'right' | 'top',
  },
  {
    eyebrow: "You're set.",
    title: 'Build your first\ncircuit.',
    body: "Try a Hadamard on q0, then a CNOT to q1. That's a Bell state — the simplest entangled circuit there is.",
    cta: 'Open the editor',
    highlight: null as null | 'sidebar' | 'right' | 'top',
  },
];

function StepIllustration({ step }: { step: number }) {
  const box: React.CSSProperties = {
    margin: '24px 0 6px',
    padding: '18px 20px',
    background: '#0e0f12',
    border: '1px solid #23262d',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 11,
    color: '#8a8f99',
    minHeight: 64,
    fontFamily: "'JetBrains Mono', monospace",
  };

  const chip = (label: string, bg: string): React.CSSProperties => ({
    display: 'inline-block',
    minWidth: 22,
    padding: '1px 4px',
    background: bg,
    color: '#0b0c0f',
    borderRadius: 3,
    fontWeight: 700,
    fontSize: 10,
    textAlign: 'center',
  });

  if (step === 0) {
    return (
      <div style={box}>
        <span style={{ fontSize: 16 }}>○</span>
        <div>
          <div style={{ color: '#d8dbe2', marginBottom: 2 }}>QuIDE / quantum integrated development</div>
          <div>4 quick steps · about 30 seconds</div>
        </div>
      </div>
    );
  }
  if (step === 1) {
    return (
      <div style={box}>
        <span style={chip('H', '#facc15')}>H</span>
        <span style={{ color: '#5c616b' }}>→</span>
        <span>|0⟩</span>
        <span style={{ flex: 1, borderTop: '1px solid #2c2f37' }} />
        <span style={{ color: '#5c616b' }}>q0</span>
      </div>
    );
  }
  if (step === 2) {
    return (
      <div style={{ ...box, display: 'block', whiteSpace: 'pre', lineHeight: 1.6, color: '#d8dbe2' }}>
{`OPENQASM 2.0;
include "qelib1.inc";
qreg q[3]; creg c[3];
h q[0];           // → superposition`}
      </div>
    );
  }
  if (step === 3) {
    return (
      <div style={box}>
        <span style={{ display: 'inline-block', padding: '2px 8px', background: '#16a34a', color: '#fff', borderRadius: 3, fontSize: 10, fontWeight: 700 }}>
          ▶ Simulate
        </span>
        <span style={{ color: '#5c616b' }}>or</span>
        <span style={{ display: 'inline-block', padding: '2px 8px', background: '#1a1d23', color: '#d8dbe2', border: '1px solid #2c2f37', borderRadius: 3, fontSize: 10 }}>
          ● IBM Quantum
        </span>
      </div>
    );
  }
  if (step === 4) {
    return (
      <div style={box}>
        <span style={chip('H', '#facc15')}>H</span>
        <span style={{ color: '#5c616b' }}>+</span>
        <span style={chip('CX', '#60a5fa')}>CX</span>
        <span style={{ color: '#5c616b' }}>=</span>
        <span style={{ color: '#d8dbe2' }}>Bell state</span>
      </div>
    );
  }
  return null;
}

function SpotlightRing({ region, visible }: { region: 'sidebar' | 'right' | 'top' | null; visible: boolean }) {
  const base: React.CSSProperties = {
    position: 'fixed',
    pointerEvents: 'none',
    border: '1px solid #4ade80',
    borderRadius: 8,
    boxShadow: '0 0 0 9999px rgba(8, 9, 12, 0.55), 0 0 24px rgba(74, 222, 128, 0.3)',
    transition: 'top 420ms cubic-bezier(0.22, 1, 0.36, 1), left 420ms cubic-bezier(0.22, 1, 0.36, 1), right 420ms cubic-bezier(0.22, 1, 0.36, 1), width 420ms cubic-bezier(0.22, 1, 0.36, 1), height 420ms cubic-bezier(0.22, 1, 0.36, 1), opacity 280ms ease',
    opacity: visible && region ? 1 : 0,
    zIndex: 99,
  };

  if (region === 'sidebar') {
    return <div style={{ ...base, top: 44, left: 6, width: 168, height: 'calc(100vh - 56px)' }} />;
  }
  if (region === 'right') {
    return <div style={{ ...base, top: 44, right: 6, width: 308, height: 'calc(100vh - 56px)' }} />;
  }
  if (region === 'top') {
    return <div style={{ ...base, top: 4, left: 6, right: 6, height: 30 }} />;
  }
  return <div style={{ ...base, top: '50%', left: '50%', width: 0, height: 0, opacity: 0 }} />;
}

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number | null>(null);

  // Animate in/out — defer visibility by one frame so CSS transition plays
  useEffect(() => {
    if (isOpen) {
      setVisible(false);
      rafRef.current = requestAnimationFrame(() => setVisible(true));
      return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  // Reset step when re-opening
  useEffect(() => {
    if (isOpen) setStep(0);
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (step < STEPS.length - 1) setStep((s) => s + 1);
        else handleClose();
      } else if (e.key === 'ArrowLeft') {
        if (step > 0) setStep((s) => s - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, step]);

  const handleClose = () => {
    onComplete();
    onClose();
  };

  if (!isOpen && !visible) return null;

  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <>
      <SpotlightRing region={s.highlight} visible={visible} />

      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(8, 9, 12, 0.55)',
          backdropFilter: 'blur(8px) saturate(120%)',
          WebkitBackdropFilter: 'blur(8px) saturate(120%)',
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? 'auto' : 'none',
          transition: 'opacity 360ms cubic-bezier(0.22, 1, 0.36, 1), backdrop-filter 360ms ease',
        }}
      >
        {/* Modal card */}
        <div
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          style={{
            width: 600,
            maxWidth: 'calc(100vw - 48px)',
            background: '#14161b',
            border: '1px solid #2c2f37',
            borderRadius: 10,
            boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 24px 80px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.4)',
            overflow: 'hidden',
            fontFamily: "'JetBrains Mono', monospace",
            color: '#d8dbe2',
            transform: visible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.985)',
            opacity: visible ? 1 : 0,
            transition: 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1) 60ms, opacity 320ms ease 60ms',
          }}
        >
          {/* Top accent rule */}
          <div style={{
            height: 1,
            background: 'linear-gradient(90deg, transparent, #3b82f6 30%, #4ade80 70%, transparent)',
            opacity: 0.5,
          }} />

          {/* Inner content */}
          <div style={{ padding: '36px 40px 28px' }}>
            <div style={{
              fontSize: 11,
              color: '#5c616b',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: 18,
              fontWeight: 500,
            }}>
              {s.eyebrow}
            </div>
            <h1 style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 28,
              fontWeight: 600,
              lineHeight: 1.15,
              color: '#d8dbe2',
              margin: 0,
              whiteSpace: 'pre-line',
              letterSpacing: '-0.01em',
            }}>
              {s.title}
            </h1>
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13,
              lineHeight: 1.6,
              color: '#8a8f99',
              marginTop: 18,
              maxWidth: 480,
              marginBottom: 0,
            }}>
              {s.body}
            </p>
            <StepIllustration step={step} />
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderTop: '1px solid #23262d',
            background: '#101216',
          }}>
            {/* Progress dots */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i === step ? 22 : 6,
                    height: 6,
                    borderRadius: 3,
                    background: i === step ? '#4ade80' : (i < step ? '#4ade80' : '#2c2f37'),
                    opacity: i < step ? 0.45 : 1,
                    transition: 'width 280ms cubic-bezier(0.22, 1, 0.36, 1), background 200ms ease, opacity 200ms ease',
                  }}
                />
              ))}
              <span style={{ marginLeft: 10, fontSize: 11, color: '#5c616b' }}>
                {step + 1} / {STEPS.length}
              </span>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {step > 0 && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  style={{
                    background: 'transparent',
                    color: '#8a8f99',
                    border: '1px solid transparent',
                    padding: '6px 12px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    cursor: 'pointer',
                    borderRadius: 4,
                  }}
                >
                  ← Back
                </button>
              )}
              {!isLast && (
                <button
                  onClick={handleClose}
                  style={{
                    background: 'transparent',
                    color: '#8a8f99',
                    border: '1px solid transparent',
                    padding: '6px 12px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    cursor: 'pointer',
                    borderRadius: 4,
                  }}
                >
                  Skip
                </button>
              )}
              <button
                onClick={() => isLast ? handleClose() : setStep((s) => s + 1)}
                style={{
                  background: '#4ade80',
                  color: '#0b0c0f',
                  border: '1px solid #22c55e',
                  padding: '6px 16px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  borderRadius: 4,
                  letterSpacing: '0.02em',
                }}
              >
                {s.cta}{!isLast && ' →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
