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
        const gAvatarurl = 'https://models.readyplayer.me/67e1544a7f65c63ac72f55d6.glb'
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
        const wallet = req.params.id;
        const usersCollection = db.collection('users');
        const walletExist = await usersCollection.findOne({ wallet });

        // Always return 200 with exists flag
        return res.status(200).json({
            exists: !!walletExist,
            message: walletExist ? "Wallet found" : "Wallet not found"
        });

    } catch (error) {
        console.error("Database error:", error);
        return res.status(500).json({
            exists: false,
            message: "Server error"
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

// Serve CV files
router.get("/api/cv/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        if (!userId) {
            return res.status(400).send("User ID is required.");
        }

        // Get the user to check if they have a CV
        const usersCollection = db.collection("users");
        const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return res.status(404).send("User not found.");
        }

        if (!user.cvPath) {
            return res.status(404).send("CV not found for this user.");
        }

        // Send the CV file
        res.sendFile(path.resolve(user.cvPath));
    } catch (err) {
        console.error("Error serving CV file:", err);
        res.status(500).send("An error occurred while serving the CV file.");
    }
});

// Get job applicants
router.get("/api/job/:jobId/applicants", async (req, res) => {
    try {
        const jobId = req.params.jobId;
        if (!jobId) {
            return res.status(400).json({ message: "Job ID is required" });
        }

        // Get the job to check if it exists and get applicants
        const jobsCollection = db.collection("job");
        const job = await jobsCollection.findOne({ _id: new ObjectId(jobId) });

        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        const applicants = job.applicants || [];
        if (applicants.length === 0) {
            return res.status(200).json({
                job_id: jobId,
                job_title: job.title || "Unknown Job",
                applicant_count: 0,
                applicants: []
            });
        }

        // Get applicant details
        const usersCollection = db.collection("users");
        const applicantDetails = [];

        for (const applicantId of applicants) {
            const user = await usersCollection.findOne(
                { _id: applicantId },
                { projection: { _id: 1, username: 1, email: 1, experience: 1, skills: 1, cvPath: 1 } }
            );

            if (user) {
                applicantDetails.push({
                    id: user._id.toString(),
                    name: user.username || "Unknown",
                    email: user.email || "No email",
                    experience: user.experience || "Not specified",
                    skills: user.skills || [],
                    has_cv: !!user.cvPath
                });
            }
        }

        return res.status(200).json({
            job_id: jobId,
            job_title: job.title || "Unknown Job",
            applicant_count: applicantDetails.length,
            applicants: applicantDetails
        });
    } catch (error) {
        console.error("Error fetching job applicants:", error);
        res.status(500).json({ message: error.message || "Internal server error" });
    }
});

// Update application status
router.post("/api/job/:jobId/applicant/:applicantId/status", async (req, res) => {
    try {
        const { jobId, applicantId } = req.params;
        const { status } = req.body; // 'accepted' or 'rejected'

        if (!jobId || !applicantId || !status) {
            return res.status(400).json({ message: "Job ID, applicant ID, and status are required" });
        }

        if (status !== 'accepted' && status !== 'rejected') {
            return res.status(400).json({ message: "Status must be 'accepted' or 'rejected'" });
        }

        // Update the application status in the job document
        const jobsCollection = db.collection("job");
        const result = await jobsCollection.updateOne(
            {
                _id: new ObjectId(jobId),
                applicants: new ObjectId(applicantId)
            },
            {
                $set: { [`application_status.${applicantId}`]: status }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Job or applicant not found" });
        }

        res.status(200).json({
            message: `Application ${status} successfully`,
            job_id: jobId,
            applicant_id: applicantId,
            status: status
        });
    } catch (error) {
        console.error(`Error updating application status:`, error);
        res.status(500).json({ message: error.message || "Internal server error" });
    }
});

// Get all jobs offered by the employer's company
router.get("/api/company/jobs/applications", async (req, res) => {
    try {
        const userId = req.query.user_id;
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        // 1. Get the employer's company_id from the users collection
        const usersCollection = db.collection("users");
        const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return res.status(404).json({ detail: "User not found" });
        }

        // Check if user is an employer
        if (user.role !== "employer") {
            return res.status(403).json({ detail: "Only employers can access company jobs" });
        }

        if (!user.company_id) {
            return res.status(400).json({ detail: "User is not associated with any company" });
        }

        const company_id = user.company_id;

        // 2. Get all jobs from this company
        const jobsCollection = db.collection("job");
        const company_jobs = await jobsCollection.find({ company_id: company_id }).toArray();

        // 3. Format the jobs data
        const jobs = company_jobs.map(job => {
            return {
                job_id: job._id.toString(),
                title: job.title || "N/A",
                description: job.description || "N/A",
                experience: job.experience || "N/A",
                company: job.company || "N/A",
                applicants_count: (job.applicants || []).length
            };
        });

        res.status(200).json({ status: "success", jobs: jobs });
    } catch (error) {
        console.error("Error fetching company jobs:", error);
        res.status(500).json({ detail: error.message || "Internal server error" });
    }
});

export default router;