import 'dotenv/config.js'
import express from 'express'
import bodyParser from 'body-parser';
import { RAGHandler } from '../bot/ragHandler.js'

const query = express();

query.use(bodyParser.json());

// Verify Gemini API key
if (!process.env.GEMINI_API_KEY) {
    console.error('ERROR: Missing GEMINI_API_KEY in .env file');
    process.exit(1);
}

const knowledgeBasePath = path.join(__dirname, '../bot/KnowledgeBase');

// Verify paths exist
if (!fs.existsSync(knowledgeBasePath)) {
    throw new Error(`KnowledgeBase directory not found at: ${knowledgeBasePath}`);
}


// Initialize RAG system
const ragHandler = new RAGHandler(
    process.env.GEMINI_API_KEY,
    knowledgeBasePath // Use absolute path
);

// Add async initialization
const initializeRAG = async () => {
    try {
        await ragHandler.initialize();
        console.log('RAG system initialized successfully');
    } catch (error) {
        console.error('Failed to initialize RAG:', error);
        process.exit(1);
    }
};

initializeRAG();


// Routing endpoint
query.post('/', async (req, res) => {
    try {
        const response = await ragHandler.handleQuery(req.body.query);
        res.json({ response });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default query

