const express = require('express');
const path = require('path');
const compression = require('compression');

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

        // Check if the file being requested is the .wasm.br file
        if (req.url.endsWith('.wasm.br')) {
            res.set('Content-Type', 'application/wasm');
        } else {
            // For other .br files, you may choose an appropriate content type
            res.set('Content-Type', 'application/javascript');
        }
    }
    next();
});

// Serve static files
app.use(express.static(path.join(__dirname, './unity-build'))); // replace 'dist' with your build folder

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
