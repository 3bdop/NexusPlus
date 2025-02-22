import express from "express"
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const routerr = express.Router();

routerr.use("/", express.static(path.join(__dirname, "../webGL")));

routerr.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../webGL", "index.html")); // Adjust the file name if necessary
});

export default routerr