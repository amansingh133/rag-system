import { useState } from 'react';
import { resetAll } from '../api/client';

export function ResetButton({ onReset }: { onReset: () => void }) {
  const [busy, setBusy] = useState(false);

  async function handleReset() {
    if (!confirm('Delete ALL documents and vectors? This cannot be undone.')) return;
    setBusy(true);
    try {
      await resetAll();
      onReset();
    } catch (e: any) {
      alert(`Reset failed: ${e?.response?.data?.error || e?.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleReset}
      disabled={busy}
      className="px-3 py-1.5 text-sm bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 disabled:opacity-50 font-medium"
    >
      {busy ? 'Resetting…' : 'Reset Everything'}
    </button>
  );
}
