import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { llm } from "../../config/gemini.js";
import { searchSimilar } from "../ingest/vectorStore.js";

const SYSTEM_PROMPT = `You are an assistant that answers questions strictly using the provided context.

Rules:
1. If the answer is not in the context, say exactly: "I don't have information about that in the uploaded documents."
2. Do not use prior knowledge unless the user explicitly asks you to.
3. Cite every factual claim using [Source: <filename>].
4. Be concise. Prefer bullet points for lists.
5. If the question is ambiguous, ask a clarifying question instead of guessing.`;

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

export async function answerQuestion(query: string): Promise<ChatResult> {
  const results = await searchSimilar(query, 2);

  if (results.length === 0) {
    return {
      answer:
        "I don't have any documents to search. Please upload some documents first.",
      sources: [],
    };
  }

  // Build context with source attribution inline (the LLM only sees the prompt)
  const contextBlock = results
    .map((doc) => {
      const m = doc.metadata as any;
      return `[Source: ${m?.filename || "unknown"}, chunk ${m?.chunkIndex ?? "?"}]\n${doc.pageContent}`;
    })
    .join("\n\n---\n\n");

  const userPrompt = `Context from uploaded documents:
---
${contextBlock}
---

Question: ${query}

Answer using only the context above. Cite the source filename for every factual claim.`;

  const response = await llm.invoke([
    new SystemMessage(SYSTEM_PROMPT),
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

  return { answer, sources };
}
