import { DocumentRow, deleteDocument } from '../api/client';

const statusColors: Record<DocumentRow['status'], string> = {
  pending: 'bg-gray-100 text-gray-700',
  parsing: 'bg-blue-100 text-blue-700',
  indexing: 'bg-blue-100 text-blue-700',
  indexed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

export function DocumentList({ documents, onDeleted }: {
  documents: DocumentRow[];
  onDeleted: () => void;
}) {
  if (documents.length === 0) {
    return <p className="text-sm text-gray-500 italic">No documents uploaded yet.</p>;
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}" and its vectors?`)) return;
    try {
      await deleteDocument(id);
      onDeleted();
    } catch (e: any) {
      alert(`Delete failed: ${e?.response?.data?.error || e?.message}`);
    }
  }

  return (
    <ul className="space-y-2">
      {documents.map((d) => (
        <li
          key={d.id}
          className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded border border-gray-100"
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate text-sm" title={d.original_filename}>
              {d.original_filename}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {d.chunk_count} chunks &middot; {Math.round((d.file_size_bytes || 0) / 1024)} KB
            </p>
            {d.error_message && (
              <p className="text-xs text-red-600 mt-1 break-words">{d.error_message}</p>
            )}
          </div>
          <span className={`text-xs px-2 py-1 rounded font-medium ${statusColors[d.status]}`}>
            {d.status}
          </span>
          <button
            onClick={() => handleDelete(d.id, d.original_filename)}
            className="text-xs text-red-600 hover:text-red-800 font-medium"
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}
