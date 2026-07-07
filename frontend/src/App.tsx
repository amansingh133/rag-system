import { useEffect, useState } from "react";
import { DocumentUpload } from "./components/DocumentUpload";
import { DocumentList } from "./components/DocumentList";
import { ChatWindow } from "./components/ChatWindow";
import { ResetButton } from "./components/ResetButton";
import { listDocuments, DocumentRow } from "./api/client";

export default function App() {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function refresh() {
      try {
        const docs = await listDocuments();
        if (cancelled) return;
        setDocuments(docs);

        // Stop polling once nothing is in-progress
        const inProgress = docs.some(
          (d) =>
            d.status === "pending" ||
            d.status === "parsing" ||
            d.status === "indexing",
        );
        if (!inProgress && intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      } catch (e) {
        console.error("listDocuments failed", e);
      }
    }

    refresh();
    intervalId = setInterval(refresh, 3000);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [refreshKey]);

  const bump = () => setRefreshKey((k) => k + 1);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">RAG System</h1>
            <p className="text-xs text-gray-500">
              Phase 1 MVP &middot; Gemini + Atlas Vector Search
            </p>
          </div>
          <ResetButton onReset={bump} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Upload Documents</h2>
            <DocumentUpload onUploaded={bump} />
          </section>

          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">
              Indexed Documents ({documents.length})
            </h2>
            <DocumentList documents={documents} onDeleted={bump} />
          </section>
        </div>

        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:sticky lg:top-6 lg:self-start">
          <h2 className="text-lg font-semibold mb-4">Chat</h2>
          <ChatWindow />
        </section>
      </main>
    </div>
  );
}
