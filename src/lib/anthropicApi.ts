// QuIDE — Anthropic API Client
// src/lib/anthropicApi.ts

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5';

const EXPLAIN_SYSTEM_PROMPT = `You are a quantum computing educator. Given an OpenQASM circuit, explain what it does in plain English — gate by gate, describing the quantum state after each operation.

Assume the reader is a software engineer who knows classical programming but is new to quantum computing. Be clear, concise, and avoid unnecessary jargon.

Structure your explanation:
1. Circuit overview (what does this circuit do?)
2. Initial state (all qubits start in |0⟩)
3. Gate-by-gate walkthrough with state evolution
4. Final state and measurement expectations

Use simple language and focus on intuition over mathematical rigor.`;

/**
 * Generate a streaming explanation of a quantum circuit using Claude Haiku 4.5
 * @param qasm - OpenQASM 2.0 circuit code
 * @param numQubits - Number of qubits in the circuit
 * @param apiKey - Anthropic API key
 * @returns AsyncGenerator yielding text chunks as they arrive
 */
export async function* explainCircuit(
  qasm: string,
  numQubits: number,
  apiKey: string
): AsyncGenerator<string> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      stream: true,
      system: EXPLAIN_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Explain this quantum circuit (${numQubits} qubits):\n\n${qasm}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Anthropic API error: ${errorData.error?.message || response.statusText}`
    );
  }

  // Parse Server-Sent Events (SSE) stream
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Decode chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });

      // Process complete lines from buffer
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();

          // Skip empty data or [DONE] marker
          if (!data || data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);

            // Extract text from content_block_delta events
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              yield parsed.delta.text;
            }

            // Handle errors in stream
            if (parsed.type === 'error') {
              throw new Error(parsed.error?.message || 'Unknown streaming error');
            }
          } catch (parseError) {
            // Skip invalid JSON lines (e.g., event: ping)
            if (parseError instanceof Error && !parseError.message.includes('JSON')) {
              throw parseError;
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
