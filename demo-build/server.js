const express = require('express');
const path = require('path');
const compression = require('compression');
const fs = require('fs');

const app = express();
const PORT = 8080; // Set the desired port

// Enable compression (supports Brotli)
app.use(
    compression({
        brotli: { enabled: true, zlib: {} },
    })
);

// Middleware to set Content-Encoding: br for .br files
app.use((req, res, next) => {
    if (req.url.endsWith('.br')) {
        res.set('Content-Encoding', 'br');
        res.set('Content-Type', 'application/javascript');
    }
    next();
});

// Serve static files
app.use(express.static(path.join(__dirname, './unity-build'))); // replace 'dist' with your build folder

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
