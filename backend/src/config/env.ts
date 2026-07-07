import dotenv from 'dotenv';
dotenv.config();

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const env = {
  PORT: parseInt(process.env.PORT || '4000', 10),

  MYSQL_HOST: required('MYSQL_HOST'),
  MYSQL_PORT: parseInt(process.env.MYSQL_PORT || '3306', 10),
  MYSQL_USER: required('MYSQL_USER'),
  MYSQL_PASSWORD: required('MYSQL_PASSWORD'),
  MYSQL_DB: required('MYSQL_DB'),

  MONGODB_URI: required('MONGODB_URI'),
  MONGODB_DB: process.env.MONGODB_DB || 'rag_system',
  MONGODB_COLLECTION: process.env.MONGODB_COLLECTION || 'chunks',
  MONGODB_INDEX: process.env.MONGODB_INDEX || 'vector_index',

  GEMINI_API_KEY: required('GEMINI_API_KEY'),
  GEMINI_LLM_MODEL: process.env.GEMINI_LLM_MODEL || 'gemini-2.0-flash',
  GEMINI_EMBEDDING_MODEL: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',

  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  MAX_UPLOAD_MB: parseInt(process.env.MAX_UPLOAD_MB || '50', 10),
};
