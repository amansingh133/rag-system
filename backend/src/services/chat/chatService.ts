import {
  HumanMessage,
  SystemMessage,
  AIMessage,
} from "@langchain/core/messages";
import { llm } from "../../config/gemini.js";
import { searchSimilar } from "../ingest/vectorStore.js";

const SYSTEM_PROMPT = `You are an assistant that answers questions using the provided document context and the conversation history.

Rules:
1. For NEW factual claims, use only the document context provided below and cite it using [Source: <filename>].
2. You MAY use the conversation history to understand follow-up questions (e.g. "the first one", "that project", "give me 2 more") — you do not need new citations to refer back to something you already said and cited earlier.
3. If a new fact is not in the document context, say exactly: "I don't have information about that in the uploaded documents."
4. Be concise. Prefer bullet points for lists.
5. Always respond in English, regardless of what language the question was asked in.`;

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Source {
  filename: string;
  chunkIndex: number;
  documentId: string;
  preview: string;
}

export interface ChatResult {
  answer: string;
  sources: Source[];
}

// --- Simple in-memory response cache ---
// Keyed on (normalized question + whether any history was present).
// Avoids burning free-tier quota when re-asking the same demo questions.
// NOT persisted — clears on server restart. Also cleared on document
// reset so stale answers from deleted documents can't leak through.
const responseCache = new Map<string, ChatResult>();

function cacheKey(query: string, history: ChatHistoryMessage[]): string {
  const normalized = query.trim().toLowerCase().replace(/\s+/g, " ");
  // Only cache genuinely history-independent questions: first turn only.
  // Follow-ups ("the first one") depend on conversation context, so they
  // are never cached — caching those could return a stale, wrong answer.
  const hasHistory = history.length > 0 ? "1" : "0";
  return `${hasHistory}::${normalized}`;
}

export function clearChatCache(): void {
  responseCache.clear();
}

export async function answerQuestion(
  query: string,
  history: ChatHistoryMessage[] = [],
): Promise<ChatResult> {
  const key = cacheKey(query, history);

  // Only serve from cache for standalone (no-history) questions —
  // safest case, since the answer can't depend on conversation context.
  if (history.length === 0 && responseCache.has(key)) {
    return responseCache.get(key)!;
  }

  const results = await searchSimilar(query, 12);

  const contextBlock =
    results.length > 0
      ? results
          .map((doc) => {
            const m = doc.metadata as any;
            return `[Source: ${m?.filename || "unknown"}, chunk ${m?.chunkIndex ?? "?"}]\n${doc.pageContent}`;
          })
          .join("\n\n---\n\n")
      : "(no matching documents found)";

  const userPrompt = `Document context (for new facts):
---
${contextBlock}
---

Question: ${query}`;

  const historyMessages = history
    .slice(-6)
    .map((m) =>
      m.role === "user"
        ? new HumanMessage(m.content)
        : new AIMessage(m.content),
    );

  const response = await llm.invoke([
    new SystemMessage(SYSTEM_PROMPT),
    ...historyMessages,
    new HumanMessage(userPrompt),
  ]);

  const answer =
    typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);

  const sources: Source[] = results.map((doc) => {
    const m = doc.metadata as any;
    return {
      filename: m?.filename || "unknown",
      chunkIndex: m?.chunkIndex ?? -1,
      documentId: m?.documentId || "",
      preview: doc.pageContent.slice(0, 200),
    };
  });

  const result: ChatResult = { answer, sources };

  if (history.length === 0) {
    responseCache.set(key, result);
  }

  return result;
}
