import { MongoDBAtlasVectorSearch } from '@langchain/mongodb';
import { Document } from '@langchain/core/documents';
import { embeddings } from '../../config/gemini.js';
import { getChunksCollection } from '../../config/mongodb.js';
import { env } from '../../config/env.js';

function getStore() {
  return new MongoDBAtlasVectorSearch(embeddings, {
    collection: getChunksCollection() as any,
    indexName: env.MONGODB_INDEX,
    textKey: 'text',
    embeddingKey: 'embedding',
  });
}

export async function addChunks(docs: Document[]): Promise<void> {
  if (docs.length === 0) return;
  const store = getStore();
  await store.addDocuments(docs);
}

export async function searchSimilar(query: string, k = 5): Promise<Document[]> {
  const store = getStore();
  return await store.similaritySearch(query, k);
}

export async function deleteByDocumentId(documentId: string): Promise<void> {
  const coll = getChunksCollection();
  await coll.deleteMany({ documentId });
}

export async function deleteAllVectors(): Promise<void> {
  const coll = getChunksCollection();
  await coll.deleteMany({});
}
