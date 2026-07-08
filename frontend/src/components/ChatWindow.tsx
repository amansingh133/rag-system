import { useState } from "react";
import { askQuestion, Source } from "../api/client";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

export function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    const q = input.trim();
    if (!q || busy) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setBusy(true);
    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const result = await askQuestion(q, history);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.answer,
          sources: result.sources,
        },
      ]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${e?.response?.data?.error || e?.message}`,
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col h-[70vh]">
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
        {messages.length === 0 && (
          <p className="text-sm text-gray-500 italic">
            Ask a question about your uploaded documents…
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user" ? "flex justify-end" : "flex justify-start"
            }
          >
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] bg-blue-600 text-white px-4 py-2 rounded-lg"
                  : "max-w-[85%] bg-gray-100 text-gray-900 px-4 py-2 rounded-lg"
              }
            >
              <p className="text-sm whitespace-pre-wrap">{m.content}</p>
              {m.sources && m.sources.length > 0 && (
                <details className="mt-2">
                  <summary className="text-xs cursor-pointer opacity-75 select-none">
                    {m.sources.length} source{m.sources.length === 1 ? "" : "s"}
                  </summary>
                  <ul className="text-xs mt-2 space-y-2 opacity-90">
                    {m.sources.map((s, j) => (
                      <li key={j} className="border-l-2 border-current/40 pl-2">
                        <strong>{s.filename}</strong>{" "}
                        <span className="opacity-60">
                          (chunk {s.chunkIndex})
                        </span>
                        <p className="opacity-75 mt-0.5 line-clamp-3">
                          {s.preview}…
                        </p>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm">
              Thinking…
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Ask a question..."
          disabled={busy}
          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 disabled:opacity-50"
        />
        <button
          onClick={send}
          disabled={busy || !input.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          Send
        </button>
      </div>
    </div>
  );
}
