// QuIDE — Circuit Explanation Display
// src/components/ide/CircuitExplanation.tsx

'use client';

import { useState } from 'react';
import { explainCircuit } from '@/lib/anthropicApi';
import { anthropicKeyStorage } from '@/lib/anthropicKeyStorage';

interface CircuitExplanationProps {
  qasm: string;
  numQubits: number;
  hasApiKey: boolean;
}

export default function CircuitExplanation({ qasm, numQubits, hasApiKey }: CircuitExplanationProps) {
  const [explanation, setExplanation] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    const apiKey = anthropicKeyStorage.load();
    if (!apiKey) {
      setError('No API key found. Please configure your Anthropic API key.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setExplanation('');

    try {
      // Stream the explanation
      for await (const chunk of explainCircuit(qasm, numQubits, apiKey)) {
        setExplanation((prev) => prev + chunk);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to generate explanation. Please check your API key.'
      );
      setExplanation('');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {!hasApiKey ? (
        <div
          style={{
            padding: '16px',
            color: '#8B949E',
            textAlign: 'center',
            fontSize: '13px',
          }}
        >
          <p>Configure your Anthropic API key to use the Explain feature.</p>
          <p style={{ marginTop: '8px', fontSize: '12px' }}>
            Click the "⚙ AI" button in the header to get started.
          </p>
        </div>
      ) : explanation || isGenerating ? (
        <>
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '12px',
              fontSize: '13px',
              lineHeight: '1.6',
              color: '#C9D1D9',
              whiteSpace: 'pre-wrap',
            }}
          >
            {explanation || 'Generating explanation...'}
            {isGenerating && (
              <span style={{ animation: 'pulse 1.5s ease-in-out infinite', opacity: 0.6 }}>
                {' '}▊
              </span>
            )}
          </div>
          <div
            style={{
              padding: '8px 12px',
              borderTop: '1px solid #30363D',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <button
              onClick={() => {
                setExplanation('');
                setError(null);
              }}
              disabled={isGenerating}
              style={{
                padding: '4px 12px',
                background: '#21262D',
                color: '#C9D1D9',
                border: '1px solid #30363D',
                borderRadius: '4px',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                opacity: isGenerating ? 0.6 : 1,
              }}
            >
              Clear
            </button>
          </div>
        </>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            gap: '16px',
            color: '#8B949E',
          }}
        >
          <p style={{ textAlign: 'center', fontSize: '13px' }}>
            Click "Generate Explanation" to get an AI-powered,<br />
            gate-by-gate breakdown of your quantum circuit.
          </p>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !qasm}
            style={{
              padding: '8px 16px',
              background: isGenerating || !qasm ? '#161B22' : '#238636',
              color: '#FFFFFF',
              border: '1px solid #30363D',
              borderRadius: '6px',
              cursor: isGenerating || !qasm ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              opacity: isGenerating || !qasm ? 0.6 : 1,
            }}
          >
            {isGenerating ? 'Generating...' : 'Generate Explanation'}
          </button>
          {error && (
            <div style={{ color: '#F85149', fontSize: '12px', textAlign: 'center' }}>
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
