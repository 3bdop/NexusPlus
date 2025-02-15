import express from "express";
import cors from "cors";
import records from "./routes/record.js";
import cookieParser from "cookie-parser";
import WebGLBuild from './routes/WebGL-build.js';

const PORT = process.env.PORT;
const app = express();

app.use(cookieParser()); // Add this before your routes
app.use(cors({
    origin: 'http://localhost:5173', // Your frontend URL
    credentials: true // Important for cookies
})); app.use(express.json());
app.use("/", records);
app.use("/webgl", WebGLBuild)

// start the Express server
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});