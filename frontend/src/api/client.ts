import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export interface DocumentRow {
  id: string;
  original_filename: string;
  mime_type: string;
  file_size_bytes: number;
  status: 'pending' | 'parsing' | 'indexing' | 'indexed' | 'failed';
  chunk_count: number;
  error_message: string | null;
  created_at: string;
  indexed_at: string | null;
}

export interface Source {
  filename: string;
  chunkIndex: number;
  documentId: string;
  preview: string;
}

export interface ChatResponse {
  answer: string;
  sources: Source[];
}

export async function uploadFile(file: File): Promise<{ documentId: string; chunkCount: number }> {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.post('/documents/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function listDocuments(): Promise<DocumentRow[]> {
  const { data } = await api.get('/documents');
  return data;
}

export async function deleteDocument(id: string): Promise<void> {
  await api.delete(`/documents/${id}`);
}

export async function askQuestion(query: string): Promise<ChatResponse> {
  const { data } = await api.post('/chat', { query });
  return data;
}

export async function resetAll(): Promise<void> {
  await api.post('/admin/reset');
}
