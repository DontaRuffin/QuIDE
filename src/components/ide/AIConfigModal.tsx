// QuIDE — AI Configuration Modal
// src/components/ide/AIConfigModal.tsx

'use client';

import { useState, useEffect } from 'react';
import { anthropicKeyStorage } from '@/lib/anthropicKeyStorage';

interface AIConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function AIConfigModal({ isOpen, onClose, onSave }: AIConfigModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Load existing API key when modal opens
      const existingKey = anthropicKeyStorage.load();
      if (existingKey) {
        setApiKey(existingKey);
      }
    }
  }, [isOpen]);

  const handleTestKey = async () => {
    if (!apiKey || apiKey.trim().length === 0) {
      setTestResult({ success: false, message: 'Please enter an API key' });
      return;
    }

    setIsTestingKey(true);
    setTestResult(null);

    try {
      // Test the API key with a simple request
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey.trim(),
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Test' }],
        }),
      });

      if (response.ok) {
        setTestResult({ success: true, message: 'API key is valid!' });
      } else {
        // Try to get error details
        let errorMessage = `Status ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorMessage;
        } catch {
          // If JSON parsing fails, use the status text
        }
        setTestResult({
          success: false,
          message: errorMessage,
        });
      }
    } catch (error) {
      // More detailed error message for debugging
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
        // Check for specific error types
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error: Unable to reach Anthropic API. Check your internet connection or try again.';
        } else if (error.message.includes('CORS')) {
          errorMessage = 'CORS error: Browser blocked the request. This is likely a temporary issue.';
        }
      }
      setTestResult({
        success: false,
        message: errorMessage,
      });
      // Log full error for debugging
      console.error('API key test error:', error);
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleSave = () => {
    if (apiKey && apiKey.trim().length > 0) {
      anthropicKeyStorage.save(apiKey.trim());
      onSave();
      onClose();
    }
  };

  const handleDelete = () => {
    anthropicKeyStorage.clear();
    setApiKey('');
    setTestResult(null);
    onSave();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#0D1117',
          border: '1px solid #30363D',
          borderRadius: '8px',
          padding: '24px',
          width: '90%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ color: '#C9D1D9', marginBottom: '16px', fontSize: '20px' }}>
          Configure AI Assistant
        </h2>

        <div
          style={{
            padding: '12px',
            backgroundColor: '#161B22',
            border: '1px solid #30363D',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#8B949E',
          }}
        >
          <p style={{ margin: 0, marginBottom: '8px' }}>
            <strong style={{ color: '#C9D1D9' }}>Privacy Notice:</strong> Your API key is stored
            locally in your browser and never sent to QuIDE servers.
          </p>
          <p style={{ margin: 0 }}>
            Using Claude 3 Haiku (~$0.25 per 1M input tokens)
          </p>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label
            htmlFor="api-key-input"
            style={{ display: 'block', color: '#C9D1D9', marginBottom: '8px', fontSize: '14px' }}
          >
            Anthropic API Key
          </label>
          <input
            id="api-key-input"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: '#0D1117',
              border: '1px solid #30363D',
              borderRadius: '6px',
              color: '#C9D1D9',
              fontSize: '14px',
              fontFamily: 'monospace',
            }}
          />
          <p style={{ marginTop: '6px', fontSize: '12px', color: '#8B949E' }}>
            Get your API key from{' '}
            <a
              href="https://console.anthropic.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#58A6FF' }}
            >
              console.anthropic.com
            </a>
          </p>
        </div>

        <div
          style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}
        >
          <button
            onClick={handleTestKey}
            disabled={isTestingKey || !apiKey}
            style={{
              padding: '8px 16px',
              backgroundColor: isTestingKey ? '#161B22' : '#21262D',
              border: '1px solid #30363D',
              borderRadius: '6px',
              color: '#C9D1D9',
              cursor: isTestingKey || !apiKey ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: isTestingKey || !apiKey ? 0.6 : 1,
            }}
          >
            {isTestingKey ? 'Testing...' : 'Test API Key'}
          </button>

          {testResult && (
            <span
              style={{
                fontSize: '13px',
                color: testResult.success ? '#3FB950' : '#F85149',
              }}
            >
              {testResult.message}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
          <button
            onClick={handleDelete}
            disabled={!anthropicKeyStorage.hasKey()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#0D1117',
              border: '1px solid #F85149',
              borderRadius: '6px',
              color: '#F85149',
              cursor: !anthropicKeyStorage.hasKey() ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: !anthropicKeyStorage.hasKey() ? 0.6 : 1,
            }}
          >
            Delete API Key
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                backgroundColor: '#21262D',
                border: '1px solid #30363D',
                borderRadius: '6px',
                color: '#C9D1D9',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!apiKey}
              style={{
                padding: '8px 16px',
                backgroundColor: apiKey ? '#238636' : '#161B22',
                border: '1px solid #30363D',
                borderRadius: '6px',
                color: '#FFFFFF',
                cursor: apiKey ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                opacity: apiKey ? 1 : 0.6,
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
