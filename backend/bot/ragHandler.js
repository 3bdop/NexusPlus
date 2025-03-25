import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs'
import path from 'path';
import { LocalIndex } from 'vectra'
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class RAGHandler {
  constructor(apiKey, dataPath) {
    if (!apiKey) {
      throw new Error('Missing Gemini API key');
    }
    this.gemini = new GoogleGenerativeAI(apiKey);
    this.dataPath = dataPath;
    this.index = new LocalIndex(path.join(__dirname, 'vector-index'));
    this.chunks = [];
    this.summaryCache = new Map();
  }

  async initialize() {
    try {
      // Reset the index directory and reinitialize LocalIndex
      await this.resetIndex();

      // Load documents and process chunks
      const documents = this.loadDocuments();
      const allChunks = this.splitText(documents);
      await this.addToVectorStore(allChunks);
      await this.preCacheSummaries(allChunks);
      console.log('Done preCaching');
    } catch (error) {
      console.error('Initialization failed:', error.message);
      throw error;
    }
  }

  resetIndex() {
    const indexDir = path.join(__dirname, 'vector-index');

    // Delete the directory if it exists
    if (fs.existsSync(indexDir)) {
      fs.rmSync(indexDir, { recursive: true, force: true });
      console.log('Deleted existing vector-index directory');
    }

    const dirPath = './vector-index'
    if (!fs.existsSync(dirPath)) {
      // Recreate the directory
      fs.mkdirSync(indexDir, { recursive: true });
      console.log('Created new vector-index directory');
    }

    // Create the index.json file with the desired structure
    const indexFilePath = path.join(indexDir, 'index.json');
    const initialIndexData = {
      version: 1,
      metadata_config: {},
      items: []
    };
    fs.writeFileSync(indexFilePath, JSON.stringify(initialIndexData, null, 2));
    console.log('Initialized index.json with default structure');

    // Reinitialize the LocalIndex
    this.index = new LocalIndex(indexDir);
    console.log('Reinitialized LocalIndex');

    // Add a small delay to ensure the index is ready
    return new Promise(resolve => setTimeout(resolve, 1000));
  }

  loadDocuments() {
    return fs.readdirSync(this.dataPath)
      .filter(file => file.endsWith('.txt'))
      .flatMap(file => {
        const filePath = path.join(this.dataPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Normalize text: lowercase, remove special characters, and extra spaces
        const normalizedContent = content
          .toLowerCase()
          .replace(/[^\w\s.]/g, '') // Remove special characters except periods
          .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
          .trim();

        // Split text into paragraphs or sentences
        return normalizedContent.split('\n\n') // Split by double newlines (paragraphs)
          .map(paragraph => paragraph.trim()) // Trim each paragraph
          .filter(paragraph => paragraph.length > 0); // Remove empty paragraphs
      });
  }

  splitText(documents, chunkSize = 512) {
    return documents.flatMap(doc => {
      const chunks = [];
      let currentChunk = '';

      // Split text into words
      const words = doc.split(' ');

      for (const word of words) {
        // Check if adding the next word exceeds the chunk size
        if ((currentChunk + ' ' + word).length > chunkSize) {
          // If so, push the current chunk and start a new one
          chunks.push(currentChunk.trim());
          currentChunk = word;
        } else {
          // Otherwise, add the word to the current chunk
          currentChunk += ' ' + word;
        }
      }

      // Push the last chunk if it's not empty
      if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
      }

      return chunks;
    });
  }

  async getEmbeddings(texts) {
    try {
      const model = this.gemini.getGenerativeModel({ model: 'embedding-001' });
      const embeddings = await Promise.all(
        texts.map(async (text) => {
          const result = await model.embedContent(text);
          return result.embedding;
        })
      );
      return embeddings;
    } catch (error) {
      console.error('Embedding failed:', error.message);
      throw error;
    }
  }

  async preCacheSummaries(chunks) {
    const DELAY_MS = 1000;

    for (const [index, chunk] of chunks.entries()) {
      try {
        this.summaryCache.set(index, chunk);
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      } catch (error) {
        console.error(`Failed to cache summary for chunk ${index}:`, error.message);
        this.summaryCache.set(index, 'Summary unavailable');
      }
    }
  }

  async withRetry(fn, retries = 3, initialDelay = 2000) {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0) {
        const delay = initialDelay * Math.pow(2, 3 - retries);
        console.log(`Retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(res => setTimeout(res, delay));
        return this.withRetry(fn, retries - 1, delay);
      }
      throw error;
    }
  }

  async generateSummary(text) {
    return this.withRetry(async () => {
      const model = this.gemini.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const prompt = `Summarize in 1 sentence: ${text}`;
      const result = await model.generateContent(prompt);
      return result.response.candidates[0].content.parts[0].text;
    });
  }

  async generateResponse(query, context) {
    try {
      const model = this.gemini.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const prompt = `Context: ${context}\n\nQuestion: ${query}\nNote:You aer a UDST career fair chatbot and the context is data about the event use it to answer. If the query is not related to the context at all then just say "Your query is ont related to UDST career fair" .\nAnswer:`;
      const result = await model.generateContent(prompt);
      return result.response.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Response generation failed:', error.message);
      throw new Error('Failed to generate response');
    }
  }

  async handleQuery(query) {
    if (this.isSummaryQuery(query)) {
      return this.handleSummaryQuery(query);
    }
    return this.handleVectorQuery(query);
  }

  isSummaryQuery(query) {
    const summaryKeywords = ['summarize', 'overview', 'main points'];
    return summaryKeywords.some(keyword =>
      query.toLowerCase().includes(keyword)
    );
  }

  async handleSummaryQuery(query) {
    const allSummaries = Array.from(this.summaryCache.values()).join('\n');
    return this.generateResponse(query, allSummaries);
  }

  async addToVectorStore(chunks) {
    if (!fs.existsSync(path.join(__dirname, 'vector-index'))) {
      throw new Error('Index directory does not exist');
    }

    const embeddings = await this.getEmbeddings(chunks);
    for (let i = 0; i < chunks.length; i++) {
      await this.index.insertItem({
        id: uuidv4(),
        vector: embeddings[i],
        metadata: { text: chunks[i] }
      });
    }
  }

  async handleVectorQuery(query) {
    const queryEmbedding = await this.getEmbeddings([query]);
    const results = await this.index.queryItems(queryEmbedding[0].values, 5);
    const context = results.map(result => result.item.metadata.text).join('\n');
    return this.generateResponse(query, context);
  }
}
