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

// Initialize RAG system with Gemini
const ragHandler = new RAGHandler(process.env.GEMINI_API_KEY, '../bot/KnowledgeBase'); //!changed route from ./ to ../
ragHandler.initialize();


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

