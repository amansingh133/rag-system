import { MongoClient, Db, Collection } from 'mongodb';
import { env } from './env.js';

let client: MongoClient | null = null;
let db: Db | null = null;
let chunksCollection: Collection | null = null;

export async function initMongo(): Promise<void> {
  client = new MongoClient(env.MONGODB_URI);
  await client.connect();
  db = client.db(env.MONGODB_DB);

  // Ensure chunks collection exists (so the user can create the vector index)
  const existing = await db.listCollections({ name: env.MONGODB_COLLECTION }).toArray();
  if (existing.length === 0) {
    await db.createCollection(env.MONGODB_COLLECTION);
    console.log(`Created collection: ${env.MONGODB_COLLECTION}`);
  }

  chunksCollection = db.collection(env.MONGODB_COLLECTION);
  console.log('MongoDB Atlas connected');
}

export function getChunksCollection(): Collection {
  if (!chunksCollection) throw new Error('MongoDB not initialized');
  return chunksCollection;
}
