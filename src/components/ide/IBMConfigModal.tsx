// QuIDE — IBM Quantum Platform Configuration Modal
// src/components/ide/IBMConfigModal.tsx

'use client';

import { useState, useEffect } from 'react';
import { ibmKeyStorage, IBMCredentials } from '@/lib/ibmKeyStorage';

interface IBMConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IBMConfigModal({ isOpen, onClose }: IBMConfigModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [region, setRegion] = useState<'us-east' | 'eu-de'>('us-east');
  const [instanceCrn, setInstanceCrn] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Load saved credentials on mount
  useEffect(() => {
    if (isOpen) {
      const saved = ibmKeyStorage.load();
      if (saved) {
        setApiKey(saved.apiKey);
        setRegion(saved.region as 'us-east' | 'eu-de');
        setInstanceCrn(saved.instanceCrn || '');
      }
    }
  }, [isOpen]);

  const handleTestKey = async () => {
    if (!apiKey || apiKey.length < 40) {
      setTestResult({ success: false, message: 'Invalid API key format (must be 44 characters)' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_SIMULATION_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/ibm/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey.trim(),
        },
        body: JSON.stringify({
          region,
          instance_crn: instanceCrn || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setTestResult({
          success: true,
          message: data.message || `Connected successfully (${data.backend_count} backends available)`,
        });
      } else {
        setTestResult({
          success: false,
          message: data.detail || 'Authentication failed',
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    if (!apiKey || apiKey.length < 40) {
      setTestResult({ success: false, message: 'Invalid API key format' });
      return;
    }

    setSaving(true);

    try {
      ibmKeyStorage.save({
        apiKey: apiKey.trim(),
        region,
        instanceCrn: instanceCrn.trim() || undefined,
      });

      setTestResult({ success: true, message: 'IBM credentials saved successfully!' });

      // Close modal after short delay
      setTimeout(() => {
        onClose();
        setSaving(false);
      }, 1000);
    } catch (error) {
      setTestResult({
        success: false,
        message: `Save error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      setSaving(false);
    }
  };

  const handleDelete = () => {
    ibmKeyStorage.clear();
    setApiKey('');
    setInstanceCrn('');
    setTestResult({ success: true, message: 'IBM credentials deleted' });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-xl w-full mx-4 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">Configure IBM Quantum Platform</h2>

        {/* Warning */}
        <div className="bg-yellow-900/30 border border-yellow-700 rounded p-3 mb-4 text-sm">
          <p className="font-semibold mb-1">⚠️ BYOK (Bring Your Own Key)</p>
          <p className="text-gray-300">
            Your IBM API key is stored locally in your browser. QuIDE never saves it to our servers.
            IBM Quantum Runtime is geo-blocked in ~30 countries.
          </p>
        </div>

        {/* API Key Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            IBM API Key <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter 44-character IBM API key"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Get your API key at{' '}
            <a
              href="https://quantum.cloud.ibm.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              quantum.cloud.ibm.com
            </a>
          </p>
        </div>

        {/* Region Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Region <span className="text-red-500">*</span>
          </label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value as 'us-east' | 'eu-de')}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
          >
            <option value="us-east">US East (Virginia)</option>
            <option value="eu-de">EU Germany (Frankfurt)</option>
          </select>
        </div>

        {/* Instance CRN (Optional) */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Instance CRN <span className="text-gray-500">(Optional)</span>
          </label>
          <input
            type="text"
            value={instanceCrn}
            onChange={(e) => setInstanceCrn(e.target.value)}
            placeholder="crn:v1:bluemix:public:quantum-computing..."
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">
            Required for IBM Cloud Premium/Flex plans. Leave empty for Open (free) plan.
          </p>
        </div>

        {/* Test Result */}
        {testResult && (
          <div
            className={`mb-4 p-3 rounded text-sm ${
              testResult.success
                ? 'bg-green-900/30 border border-green-700 text-green-300'
                : 'bg-red-900/30 border border-red-700 text-red-300'
            }`}
          >
            {testResult.message}
          </div>
        )}

        {/* Pricing Info */}
        <div className="bg-gray-800 border border-gray-700 rounded p-3 mb-4 text-xs text-gray-300">
          <p className="font-semibold mb-1">IBM Pricing:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Open Plan (free): ibm_kingston (127 qubits) - no charge</li>
            <li>Pay-As-You-Go: ~$96/minute of QPU time</li>
            <li>Premium/Flex Plan: $30K minimum</li>
          </ul>
          <p className="mt-2 text-yellow-400">
            QuIDE only routes your jobs. IBM charges are separate from QuIDE subscription.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleTestKey}
            disabled={testing || !apiKey}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white font-medium transition-colors"
          >
            {testing ? 'Testing...' : 'Test API Key'}
          </button>

          <button
            onClick={handleSave}
            disabled={saving || !apiKey}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white font-medium transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>

          {ibmKeyStorage.hasKey() && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white font-medium transition-colors"
            >
              Delete Key
            </button>
          )}

          <button
            onClick={onClose}
            className="ml-auto px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
