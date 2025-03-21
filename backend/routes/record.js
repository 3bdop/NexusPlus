import express from "express"
//? This will help us connect to the db

import db from "../db/connection.js"

//? This help convert the id from string to ObjectId for the _id.
import { ObjectId } from "mongodb";
import crypto from 'crypto'; // For generating session IDs
import validateSession from "../middleware/validateSession.js"
import multer from "multer";
import fs from 'fs'

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
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
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
})

router.post('/api/register', async (req, res) => {
    try {
        const { wallet, username, email, gender } = req.body

        if (!wallet || !email || !username || !gender) {
            return res.status(400).json({ message: "Missing required fields." });
        }
        const usersCollection = db.collection('users');

        const existingUser = await usersCollection.findOne({ wallet });
        if (existingUser) {
            return res.status(400).json({ message: "Wallet is already registered." });
        }
        const gAvatarurl = 'https://models.readyplayer.me/671fba5095f66d10f33251c6.glb'
        if (gender == 'girl') {
            gAvatarurl = "https://models.readyplayer.me/67228d2ba754a4d51bc05336.glb"
        }

        await usersCollection.insertOne(
            {
                wallet,
                username: username,
                email: email,
                avatarUrl: gAvatarurl,
                role: 'attendee',
                gender
            });

        res.status(201).json({ message: "Registration successful!" });
    }
    catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Server error during registration." });
    }
})

router.get('/api/getUserByWallet/:id', async (req, res) => {
    try {
        const wallet = req.params.id
        const usersCollection = db.collection('users')
        const walletExist = await usersCollection.findOne({ wallet })

        if (!walletExist) {
            return res.status(301).json({ message: "Wallet not found in db, please register first", exists: false })
        }
        return res.status(200).json({ message: "wallet found!", exists: true })
    } catch (error) {
        return res.status(404).json({ message: "some error happened while checking wallet" })
    }
})

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
        if (!sessionId) {
            return res.status(401).send("No session found.");
        }

        // Get user info from session
        const sessionCollection = db.collection("session");
        const session = await sessionCollection.findOne({ sessionId });
        if (!session) {
            return res.status(401).send("Invalid session.");
        }

        // Update user document with CV path
        const usersCollection = db.collection("users");
        const result = await usersCollection.updateOne(
            { _id: new ObjectId(session.userId) },
            { $set: { cvPath: req.file.path } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).send("User not found or CV not updated.");
        }

        res.status(200).json({
            message: "CV uploaded successfully",
            cvPath: req.file.path
        });
    } catch (error) {
        console.error("Error uploading CV:", error);
        res.status(500).send("Error uploading CV.");
    }
});

export default router;