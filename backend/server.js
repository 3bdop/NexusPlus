// import express from "express";
// import cors from "cors";
// import records from "./routes/record.js";
// import cookieParser from "cookie-parser";
// import botRoute from "./routes/botRoute.js";

// const app = express();

// app.use(cookieParser()); // Add this before your routes
// const allowedOrigins = [
//     "https://nexusplus.vercel.app"
// ];

// app.use(
//     cors({
//         origin: function (origin, callback) {
//             // Allow requests with no origin (like mobile apps or curl requests)
//             if (!origin) return callback(null, true);
//             if (allowedOrigins.indexOf(origin) === -1) {
//                 const msg =
//                     "The CORS policy for this site does not allow access from the specified origin.";
//                 return callback(new Error(msg), false);
//             }
//             return callback(null, true);
//         },
//         credentials: true,
//     })
// );

// app.use(express.json());

// app.use("/", records);
// app.use("/query", botRoute);

// // For local development, start the server if not on Vercel
// if (!process.env.VERCEL) {
//     const PORT = process.env.PORT || 5050;
//     app.listen(PORT, "0.0.0.0", () => {
//         console.log(`Server listening on port ${PORT}`);
//     });
// }

// export default app;


import express from "express";
import corsConfig from "./middleware/cors.js";  // Changed import
import records from "./routes/record.js";
import cookieParser from "cookie-parser";
import botRoute from "./routes/botRoute.js";

const app = express();

// Middleware order matters!
app.use(cookieParser());
app.use(express.json());
app.use(corsConfig);  // Use the new CORS config

// Routes
app.use("/", records);
app.use("/query", botRoute);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        nodeEnv: process.env.NODE_ENV
    });
});

// For local development
if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 5050;
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode`);
        console.log(`Listening on port ${PORT}`);
    });
}

export default app;