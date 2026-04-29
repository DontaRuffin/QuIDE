'use client';

import { useState, useEffect, useRef } from 'react';
import { analyzeCircuit, findingsToText, type Finding, type AnalysisResult } from '@/lib/circuitAnalyzer';
import { anthropicKeyStorage } from '@/lib/anthropicKeyStorage';
import type { IBMBackend } from '@/lib/ibmApi';

const DEBUG_SYSTEM_PROMPT = `You are a quantum hardware engineer reviewing a user's circuit for issues.

Given a list of static analysis findings and the circuit QASM, explain each issue in plain English and give one concrete fix suggestion per issue. Be concise — 2-3 sentences per issue. Use the gate names and qubit indices from the circuit in your explanations so they feel specific. If there are no issues, say the circuit looks clean and what makes it well-structured.`;

const SEVERITY_COLORS: Record<string, { dot: string; text: string; border: string; bg: string }> = {
  error:   { dot: '#f85149', text: '#f85149', border: '#3d1a1a', bg: '#1a0a0a' },
  warning: { dot: '#e3b341', text: '#e3b341', border: '#3d2e0a', bg: '#1a1500' },
  info:    { dot: '#388bfd', text: '#8a8f99', border: '#1a2a3a', bg: '#0a1020' },
};

function FindingCard({ finding }: { finding: Finding }) {
  const [expanded, setExpanded] = useState(true);
  const c = SEVERITY_COLORS[finding.severity];

  return (
    <div
      style={{
        border: `1px solid ${c.border}`,
        background: c.bg,
        borderRadius: 6,
        marginBottom: 8,
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: c.text, flex: 1, fontWeight: 600 }}>
          {finding.title}
        </span>
        <span style={{ color: '#5c616b', fontSize: 10 }}>{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div style={{ padding: '0 12px 10px 27px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#8a8f99', lineHeight: 1.6 }}>
          {finding.detail}
        </div>
      )}
    </div>
  );
}

function CleanBadge() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px 14px',
      background: '#0a1a0a',
      border: '1px solid #1a3a1a',
      borderRadius: 6,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12,
      color: '#3fb950',
    }}>
      <span>✓</span>
      <span>No issues found — circuit looks good.</span>
    </div>
  );
}

interface Props {
  qasm: string;
  numQubits: number;
  selectedBackend: string;
  ibmBackends: IBMBackend[];
  hasApiKey: boolean;
}

export default function CircuitDebugger({ qasm, numQubits, selectedBackend, ibmBackends, hasApiKey }: Props) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const isIBM = selectedBackend !== 'aer_simulator' && selectedBackend !== 'aer_simulator_shot';
  const activeBackend = ibmBackends.find((b) => b.name === selectedBackend) ?? null;

  // Re-run analysis whenever QASM or backend changes
  useEffect(() => {
    setAnalysis(analyzeCircuit(qasm, isIBM ? activeBackend : null));
    setAiText('');
    setAiError('');
  }, [qasm, selectedBackend, ibmBackends]);

  const handleAiAnalyze = async () => {
    if (!hasApiKey || !analysis) return;

    const apiKey = anthropicKeyStorage.load();
    if (!apiKey) return;

    setAiLoading(true);
    setAiText('');
    setAiError('');

    const backendUrl = process.env.NEXT_PUBLIC_SIMULATION_URL || 'http://localhost:8000';
    const backendLabel = isIBM ? selectedBackend : 'Aer simulator';
    const findingsSummary = analysis.findings.length > 0
      ? findingsToText(analysis.findings)
      : 'No issues detected by static analysis.';

    const userMsg =
      `Backend: ${backendLabel}\n` +
      `Qubits: ${numQubits}\n` +
      `Gate count: ${analysis.gateCount}\n\n` +
      `Static analysis findings:\n${findingsSummary}\n\n` +
      `Circuit QASM:\n${qasm}`;

    abortRef.current = new AbortController();

    try {
      const response = await fetch(`${backendUrl}/anthropic/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey.trim(),
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 800,
          stream: true,
          system: DEBUG_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userMsg }],
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || response.statusText);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (!data || data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              setAiText((t) => t + parsed.delta.text);
            }
          } catch {}
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setAiError(err.message || 'AI request failed');
      }
    } finally {
      setAiLoading(false);
    }
  };

  if (!analysis) return null;

  const errors = analysis.findings.filter((f) => f.severity === 'error');
  const warnings = analysis.findings.filter((f) => f.severity === 'warning');
  const infos = analysis.findings.filter((f) => f.severity === 'info');

  const summaryColor =
    errors.length > 0 ? '#f85149' :
    warnings.length > 0 ? '#e3b341' :
    '#3fb950';

  const summaryText =
    errors.length > 0 ? `${errors.length} error${errors.length > 1 ? 's' : ''}, ${warnings.length} warning${warnings.length !== 1 ? 's' : ''}` :
    warnings.length > 0 ? `${warnings.length} warning${warnings.length > 1 ? 's' : ''}` :
    infos.length > 0 ? 'Circuit empty' :
    'No issues';

  return (
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#8a8f99' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: summaryColor, fontWeight: 600 }}>{summaryText}</span>
          {analysis.gateCount > 0 && (
            <span style={{ color: '#5c616b' }}>· {analysis.gateCount} gate{analysis.gateCount !== 1 ? 's' : ''}</span>
          )}
        </div>
        {analysis.isAerOnly && (
          <span style={{ fontSize: 10, color: '#5c616b', padding: '2px 7px', border: '1px solid #23262d', borderRadius: 10 }}>
            Aer only
          </span>
        )}
      </div>

      {/* IBM-only hint when Aer is selected */}
      {analysis.isAerOnly && (
        <div style={{
          padding: '8px 12px',
          background: '#0e0f12',
          border: '1px solid #23262d',
          borderRadius: 6,
          fontSize: 11,
          color: '#5c616b',
          marginBottom: 12,
        }}>
          Switch to an IBM backend in the header to enable coupling map, basis gate, and decoherence checks.
        </div>
      )}

      {/* Findings */}
      {analysis.findings.length === 0 ? (
        <CleanBadge />
      ) : (
        <div>
          {[...errors, ...warnings, ...infos].map((f) => (
            <FindingCard key={f.id} finding={f} />
          ))}
        </div>
      )}

      {/* AI debug section */}
      <div style={{ marginTop: 16, borderTop: '1px solid #23262d', paddingTop: 14 }}>
        {!hasApiKey ? (
          <div style={{ fontSize: 11, color: '#5c616b' }}>
            Add an Anthropic key via ⚙ AI to get a plain-English explanation of any issues.
          </div>
        ) : (
          <button
            onClick={handleAiAnalyze}
            disabled={aiLoading}
            style={{
              background: aiLoading ? '#1a1d23' : '#14161b',
              color: aiLoading ? '#5c616b' : '#8a8f99',
              border: '1px solid #2c2f37',
              borderRadius: 4,
              padding: '5px 14px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              cursor: aiLoading ? 'default' : 'pointer',
              marginBottom: aiText || aiError ? 12 : 0,
            }}
          >
            {aiLoading ? '⟳ Analyzing...' : '⬡ Explain issues with AI'}
          </button>
        )}

        {aiError && (
          <div style={{ fontSize: 11, color: '#f85149', marginTop: 8 }}>{aiError}</div>
        )}

        {aiText && (
          <div style={{
            whiteSpace: 'pre-wrap',
            lineHeight: 1.7,
            fontSize: 12,
            color: '#8a8f99',
            padding: '10px 14px',
            background: '#0e0f12',
            border: '1px solid #23262d',
            borderRadius: 6,
          }}>
            {aiText}
            {aiLoading && <span style={{ opacity: 0.5 }}>▌</span>}
          </div>
        )}
      </div>
    </div>
  );
}
