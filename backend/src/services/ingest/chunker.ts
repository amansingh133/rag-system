import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 800,
  chunkOverlap: 150,
  separators: ['\n\n', '\n', '. ', ' ', ''],
});

export async function chunkText(text: string): Promise<string[]> {
  const cleaned = text.replace(/\s+\n/g, '\n').trim();
  if (!cleaned) return [];
  return await splitter.splitText(cleaned);
}
