import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from "@langchain/google-genai";
import { env } from "./env.js";

export const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: env.GEMINI_API_KEY,
  model: env.GEMINI_EMBEDDING_MODEL,
});

export const llm = new ChatGoogleGenerativeAI({
  apiKey: env.GEMINI_API_KEY,
  model: env.GEMINI_LLM_MODEL,
  temperature: 0.2,
});
