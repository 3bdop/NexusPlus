import express from "express"

//? This will help us connect to the db

import db from "../db/connection.js"

//? This help convert the id from string to ObjectId for the _id.
import { ObjectId } from "mongodb";
import crypto from 'crypto'; // For generating session IDs
import bcrypt from 'bcrypt';
import validateSession from "../middleware/validateSession.js"

// router is an instance of the express router.
// We use it to define our routes.
// The router will be added as a middleware and will take control of requests starting with path /record.
const router = express.Router();

//* This section will help you get a list of all the records.
router.get("/", async (req, res) => {
    let collection = await db.collection("users");
    let results = await collection.find({}).toArray();
    res.send(results).status(200);
});

//* This section will help you get a single record by id
router.get("/:id", async (req, res) => {
    let collection = await db.collection("users");
    let query = { _id: new ObjectId(req.params.id) };
    let result = await collection.findOne(query);
    console.log(query)
    if (!result) res.send("Not found").status(404);
    else res.send(result).status(200);
});

//* This section will help you create a new record.
// router.post("/", async (req, res) => {
//     try {
//         let newDocument = {
//             name: req.body.name,
//             position: req.body.position,
//             level: req.body.level,
//         };
//         let collection = await db.collection("users");
//         let result = await collection.insertOne(newDocument);
//         res.send(result).status(204);
//     } catch (err) {
//         console.error(err);
//         res.status(500).send("Error adding record");
//     }
// });

//*This will check login.
router.post("/api/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if username and password are provided
        if (!username || !password) {
            return res.status(400).send("Username and password are required.");
        }

        // Find the user in the database
        const usersCollection = db.collection("users");
        const user = await usersCollection.findOne({ username });

        // If user doesn't exist
        if (!user) {
            return res.status(404).send("User not found.");
        }

        // Compare the provided password with the stored hashed password
        // const isPasswordValid = await bcrypt.compare(password, user.password);
        const isPasswordValid = password == user.password

        if (!isPasswordValid) {
            return res.status(401).send("Invalid password.");
        }

        // Generate a session ID
        const sessionId = crypto.randomBytes(16).toString('hex');

        // Set session expiration time (e.g., 1 hour from now)
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        // Store the session in the sessions collection
        const sessionsCollection = db.collection('session');
        await sessionsCollection.insertOne({
            sessionId,
            userId: user._id,
            username: user.username,
            expiresAt,
        });

        // Set a cookie with the session ID
        res.cookie('sessionId', sessionId, {
            httpOnly: true,
            // secure: process.env.NODE_ENV !== 'production',
            maxAge: 5 * 60 * 1000,
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

//* This section will help you update a record by id.
router.patch("/:id", async (req, res) => {
    try {
        const query = { _id: new ObjectId(req.params.id) };
        const updates = {
            $set: {
                name: req.body.name,
                position: req.body.position,
                level: req.body.level,
            },
        };

        let collection = await db.collection("users");
        let result = await collection.updateOne(query, updates);
        res.send(result).status(200);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating record");
    }
});

//* This section will help you delete a record
router.delete("/:id", async (req, res) => {
    try {
        const query = { _id: new ObjectId(req.params.id) };

        const collection = db.collection("users");
        let result = await collection.deleteOne(query);

        res.send(result).status(200);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting record");
    }
});

router.get("/api/check-auth", validateSession, (req, res) => {
    res.status(200).json({
        authenticated: true,
        user: {
            username: req.user.username
        }
    });
});

router.patch("/api/add-avatarId", async (req, res) => {
    try {
        const { avatarUrl } = req.body;

        if (!avatarUrl) {
            return res.status(400).json({ message: "Avatar URL is required" });
        }

        const usersCollection = db.collection("users");
        const result = await usersCollection.updateOne(
            { username: req.user.username },
            { $set: { avatarUrl: avatarUrl } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: "User not found or avatar not updated" });
        }

        res.status(200).json({
            message: "Avatar updated successfully",
            avatarUrl: avatarUrl
        });

    } catch (error) {
        console.error("Error updating avatar:", error);
        res.status(500).json({ message: "Error updating avatar" });
    }
})
export default router;