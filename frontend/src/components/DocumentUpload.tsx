import { useRef, useState } from 'react';
import { uploadFile } from '../api/client';

export function DocumentUpload({ onUploaded }: { onUploaded: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await uploadFile(file);
      setSuccess(`Indexed "${file.name}" — ${result.chunkCount} chunks`);
      onUploaded();
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || 'Upload failed';
      setError(msg);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
      <label className="block">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md,.csv,.xlsx,.xls"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
          className="block w-full text-sm text-gray-600
            file:mr-4 file:py-2 file:px-4
            file:rounded file:border-0
            file:text-sm file:font-medium
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
            disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </label>

      {busy && <p className="mt-3 text-sm text-blue-600">Uploading, parsing, and embedding…</p>}
      {error && <p className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">{error}</p>}
      {success && <p className="mt-3 text-sm text-green-700 bg-green-50 p-2 rounded border border-green-200">{success}</p>}

      <p className="mt-3 text-xs text-gray-500">
        Supported formats: PDF, DOCX, TXT, MD, CSV, XLSX
      </p>
    </div>
  );
}
