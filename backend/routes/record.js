import pdcaContract from "../utils/contracts.js";
import { issueCertificate } from "../utils/pdcaContract.js";
import express from "express"
//? This will help us connect to the db

import db from "../db/connection.js"

//? This help convert the id from string to ObjectId for the _id.
import { ObjectId } from "mongodb";
import crypto from 'crypto'; // For generating session IDs
import validateSession from "../middleware/validateSession.js"
import multer from "multer";
import fs from 'fs'
import path from "path";

// Configure multer for CV storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = './uploads/cv';
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: async function (req, file, cb) {
        try {
            // Get session ID from cookies
            const sessionId = req.cookies.sessionId;
            if (!sessionId) {
                throw new Error('No session found');
            }

            // Get user ID from session
            const session = await db.collection("session").findOne({ sessionId });
            if (!session) {
                throw new Error('Invalid session');
            }

            // Use userId as filename with PDF extension
            const userId = session.userId;
            const filename = `${userId}.pdf`;
            cb(null, filename);

        } catch (error) {
            cb(error);
        }
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    },
    limits: {
        fileSize: 3 * 1024 * 1024 // 3MB limit
    }
});

// The router will be added as a middleware and will take control of requests starting with path /record.
const router = express.Router();


//* This section will help you get a single record by id
router.get("/api/get-avatarUrl/:id", async (req, res) => {
    try {
        const userId = req.params.id;
        if (!userId) {
            return res.status(400).send("User ID is required.");
        }

        const collection = db.collection("users");
        const result = await collection.findOne({ _id: new ObjectId(userId) });

        if (!result) {
            return res.status(404).send("User not found.");
        }

        res.status(200).send({ avatarUrl: result.avatarUrl });
    } catch (err) {
        console.error("Error fetching avatar URL:", err);
        res.status(500).send("An error occurred while fetching the avatar URL.");
    }
});

router.get("/api/get-session", async (req, res) => {
    try {
        const sessionId = req.cookies.sessionId; // Assuming the session ID is stored in a cookie
        if (!sessionId) {
            return res.status(400).send("Session ID is required.");
        }

        const collection = db.collection("session");
        const result = await collection.findOne({ sessionId });

        if (!result) {
            return res.status(404).send("Session not found.");
        }

        res.status(200).send({ userId: result.userId, username: result.username, avatarUrl: result.avatarUrl });
    } catch (err) {
        console.error("Error fetching session data:", err);
        res.status(500).send("An error occurred while fetching session data.");
    }
});
//*This will check login.
router.post("/api/login", async (req, res) => {
    try {
        const wallet = req.body.wallet;
        if (!wallet) {
            return res.status(400).json({ message: "Wallet address is required." });
        }

        const usersCollection = db.collection('users')
        const user = await usersCollection.findOne({ wallet });

        if (!user) {
            return res.status(401).json({ message: "Wallet not registered. Please sign up first." });
        }

        // ✅ Certificate validity check
        const now = Math.floor(Date.now() / 1000); // current time in seconds
        const cert = user.certificate;

        if (!cert || !cert.isValid || cert.expiresAt < now) {
            return res.status(403).json({
                message: "Your certificate is expired or invalid. Please contact support."
            });
        }

        // Generate a session ID
        const sessionId = crypto.randomBytes(16).toString('hex');

        // Set session expiration time (e.g., 1 hour from now)
        const expiresAt = new Date(Date.now() + 50 * 60 * 1000); //!Change the session duration latter

        // Store the session in the sessions collection
        const sessionsCollection = db.collection('session');
        await sessionsCollection.insertOne({
            sessionId,
            wallet,
            userId: user._id,
            username: user.username,
            avatarUrl: user.avatarUrl,
            role: user.role,
            loggedIn: true,
            expiresAt,
        });

        // Set a cookie with the session ID
        res.cookie('sessionId', sessionId, {
            httpOnly: true,
            // secure: process.env.NODE_ENV !== 'production',
            maxAge: 50 * 60 * 1000,  //!Change the session duration latter
            sameSite: 'lax', // Add this
            path: '/' // Add this
        });

        // If login is successful
        // Send response
        res.status(200).json({
            message: "Login successful!",
            user: { username: user.username }
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).send("An error occurred during login.");
    }
});

router.post("/api/register", async (req, res) => {
    try {
        const { wallet, username, email, gender, role, avatarUrl } = req.body;
        const usersCollection = db.collection("users");

        const existing = await usersCollection.findOne({ wallet });
        if (existing) {
            return res.status(409).json({ message: "Wallet already registered." });
        }

        const did = `wallet:${wallet}`;
        const validityPeriod = 365 * 24 * 60 * 60; // 1 year
        const issuedAt = Math.floor(Date.now() / 1000);
        const expiresAt = issuedAt + validityPeriod;

        const success = await issueCertificate(did, validityPeriod);
        if (!success) {
            return res.status(500).json({ message: "Certificate issue failed." });
        }

        const newUser = {
            wallet,
            username,
            email,
            gender,
            role,
            avatarUrl,
            certificate: {
                did,
                issuedBy: "UDST",
                issuedAt,
                expiresAt,
                isValid: true
            }
        };

        const result = await usersCollection.insertOne(newUser);
        res.status(201).json({ message: "User registered and certificate issued!", id: result.insertedId });
    } catch (err) {
        console.error("Registration error:", err);
        res.status(500).send("Registration failed.");
    }
});
router.get('/api/getUserByWallet/:id', async (req, res) => {
    try {
        const wallet = req.params.id;
        const usersCollection = db.collection('users');
        const walletExist = await usersCollection.findOne({ wallet });

        // Always return 200 with exists flag
        return res.status(200).json({
            exists: !!walletExist,
            message: walletExist ? "Wallet found" : "Wallet not found"
        });

    } catch (error) {
        console.error("Error checking wallet:", error);
        return res.status(500).json({
            exists: false,
            message: "Error checking wallet"
        });
    }
});

router.get("/api/check-auth", validateSession, (req, res) => {
    res.status(200).json({
        authenticated: true,
        username: req.user.username,
        role: req.user.role

    });
});

router.patch("/api/add-avatarId", async (req, res) => {
    try {
        const { userId, avatarUrl } = req.body;

        if (!userId || !avatarUrl) {
            return res.status(400).json({ message: "User ID and avatar URL are required." });
        }

        const usersCollection = db.collection("users");
        const result = await usersCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $set: { avatarUrl: avatarUrl } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: "User not found or avatar not updated." });
        }

        res.status(200).json({
            message: "Avatar updated successfully",
            avatarUrl: avatarUrl,
        });
    } catch (error) {
        console.error("Error updating avatar:", error);
        res.status(500).json({ message: "Error updating avatar." });
    }
});

router.post("/api/logout", async (req, res) => {
    try {
        const sessionId = req.cookies.sessionId; // Assuming the session ID is stored in a cookie
        if (!sessionId) {
            return res.status(400).send("Session ID is required.");
        }

        const collection = db.collection("session");
        const result = await collection.deleteOne({ sessionId });

        if (result.deletedCount === 0) {
            return res.status(404).send("Session not found.");
        }

        // Clear the session cookie
        res.clearCookie('sessionId', {
            httpOnly: true,
            sameSite: 'lax',
            path: '/'
        });

        res.status(200).send("Logout successful.");
    } catch (err) {
        console.error("Error during logout:", err);
        res.status(500).send("An error occurred during logout.");
    }
});

// Add new route to handle CV upload
router.post("/api/upload-cv", upload.single('cv_file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send("No file uploaded.");
        }

        const sessionId = req.cookies.sessionId;
        const session = await db.collection("session").findOne({ sessionId });

        // Update user document with CV metadata
        await db.collection("users").updateOne(
            { _id: new ObjectId(session.userId) },
            {
                $set: { cvPath: req.file.path, }
            }
        );

        res.status(200).json({
            message: "CV uploaded successfully",
            cvPath: `/cv/${req.file.filename}` // Return web-accessible path
        });
    } catch (error) {
        console.error("Error uploading CV:", error);
        res.status(500).send(error.message || "Error uploading CV.");
    }
});

export default router;