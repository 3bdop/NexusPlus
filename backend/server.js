import express from "express";
import cors from "cors";
import records from "./routes/record.js";
import cookieParser from "cookie-parser";
import botRoute from "./routes/botRoute.js";
import adminStat from './routes/adminStats.js'

const app = express();

app.use(cookieParser()); // Add this before your routes
const allowedOrigins = [
    "http://localhost:5173",
    "http://192.168.118.115:5173",
];

app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);
            if (allowedOrigins.indexOf(origin) === -1) {
                const msg =
                    "The CORS policy for this site does not allow access from the specified origin.";
                return callback(new Error(msg), false);
            }
            return callback(null, true);
        },
        credentials: true, // Important for cookies
    })
);

app.use(express.json());

app.use("/", records);
app.use("/query", botRoute);
app.use("/api", adminStat);

// For local development, start the server if not on Vercel
if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 5050;
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server listening on port ${PORT}`);
    });
}

export default app;

