import express from "express"
//? This will help us connect to the db

import db from "../db/connection.js"

//? This help convert the id from string to ObjectId for the _id.
import { ObjectId } from "mongodb";
import crypto from 'crypto'; // For generating session IDs
import validateSession from "../middleware/validateSession.js"
import fs from 'fs'
import path from "path";
import { put } from '@vercel/blob';
import multer from 'multer';
import axios from 'axios'
import { sendOtpEmail } from "../utils/sendEmail.js";
import bcrypt from 'bcrypt';

const upload = multer({
    storage: multer.memoryStorage(), // Store file in memory
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {                              //! NEW
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    },
    limits: { fileSize: 3 * 1024 * 1024 } // 3MB
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
            secure: true,
            sameSite: "none",
            maxAge: 50 * 60 * 1000,  //!Change the session duration latter
            path: '/', // Add this
        });

        // If login is successful
        // Send response
        res.status(200).json({
            msg: "Login successful!",
            user: { username: user.username }
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).send("An error occurred during login.");
    }
})

router.post("/api/register", async (req, res) => {
    const { wallet, username, email, gender } = req.body;
  
    if (!wallet || !email || !username) {
      return res.status(400).json({ message: "Wallet, username, and email are required." });
    }
  
    try {
  
      // 2️⃣ Generate OTP & expiration time
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      const salt = await bcrypt.genSalt(10);
      const hashedOtp = await bcrypt.hash(otp, salt);
      
    
     // default avatar

     let gAvatarurl = 'https://models.readyplayer.me/6724fc91b18f3023ffd2b197.glb';
     if (gender == 'girl') {
         gAvatarurl = "https://models.readyplayer.me/67f3aea0fa421e45fd2df18d.glb";
     }

     
    // 3️⃣ Store or update user in DB
    await db.collection("users").updateOne(
      { wallet },
      {
        $set: {
          username,
          email,
          avatarUrl: gAvatarurl,
          role: "attendee",
          gender,
          hashedOtp,
          otpExpiresAt,
          isVerified: false,
        },
      },
      { upsert: true }
    );

    // 4️⃣ Send the OTP via email
    await sendOtpEmail(email, otp);

    res.status(200).json({ message: "OTP sent to your email. Please check your spam/junk." });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Registration failed. Please try again." });
  }
});

router.post("/api/verify-otp", async (req, res) => {
    const { wallet, otp } = req.body;
  
    if (!wallet || !otp) {
      return res.status(400).json({ message: "Wallet and OTP are required." });
    }
  
    try {
      const user = await db.collection("users").findOne({ wallet });
  
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
  
      if (user.isVerified) {
        return res.status(409).json({ message: "User already verified." });
      }

      if (!user.hashedOtp || !user.otpExpiresAt) {
        return res.status(400).json({ message: "No OTP found for this user." });
      }
  
      const now = new Date();
      if (now > new Date(user.otpExpiresAt)) {
        return res.status(410).json({ message: "OTP expired. Please request a new one." });
      }
  
      const isMatch = await bcrypt.compare(otp.toString(), user.hashedOtp);

      if (!isMatch) {
        return res.status(401).json({ message: "Invalid OTP. Please try again." });
      }
  
      // ✅ Generate a Decentralized Identifier (DID) using wallet address
      const did = `${wallet}`;
  
      // ✅ Update MongoDB to reflect verification + cert status
      await db.collection("users").updateOne(
        { wallet },
        {
          $set: {
            isVerified: true,
            certificate: {
              did,
              issuedBy: "UDST",
              issuedAt: Date.now(),
              expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
              isValid: true
            }
          },
          $unset: { otp: "", otpExpiresAt: "" }
        }
      );
  
      res.status(200).json({ msg: "OTP verified. Certificate issued successfully." });
  
    } catch (err) {
      console.error("OTP verification error:", err);
      res.status(500).json({ message: "Verification failed. Please try again." });
    }
  });

// router.post('/api/register', async (req, res) => {
//     try {
//         const { wallet, username, email, gender } = req.body

//         if (!wallet || !email || !username || !gender) {
//             return res.status(400).json({ message: "Missing required fields." });
//         }
//         const usersCollection = db.collection('users');

//         const existingUser = await usersCollection.findOne({ wallet });
//         if (existingUser) {
//             return res.status(400).json({ message: "Wallet is already registered." });
//         }
//         let avatarUrl = 'https://models.readyplayer.me/67f3af37d4370bf8b07443f8.glb'
//         if (gender.toLowerCase() == 'female') {
//             avatarUrl = "https://models.readyplayer.me/67f3aea0fa421e45fd2df18d.glb"
//         }

//         await usersCollection.insertOne(
//             {
//                 wallet,
//                 username: username,
//                 email: email,
//                 avatarUrl,
//                 role: 'attendee',
//                 gender: gender.toLowerCase()
//             });

//         res.status(201).json({ message: "Registration successful!" });
//     }
//     catch (error) {
//         console.error("Registration error:", error);
//         res.status(500).json({ message: "Server error during registration." });
//     }
// })
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

router.patch("/api/add-avatarId", validateSession, async (req, res) => {
    try {
        const { avatarUrl } = req.body;
        const userId = req.user.id;

        if (!userId || !avatarUrl) {
            return res.status(400).json({ message: "User ID and avatar URL are required." });
        }

        const usersCollection = db.collection("users");
        const result = await usersCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $set: { avatarUrl: avatarUrl } }
        );

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

        // Get session and user ID
        const sessionId = req.cookies.sessionId;
        const session = await db.collection("session").findOne({ sessionId });
        if (!session) throw new Error('Invalid session');

        // Upload to Vercel Blob
        const filename = `${session.userId}.pdf`;
        const blob = await put(filename, req.file.buffer, {
            access: 'public',
            contentType: 'application/pdf',
            addRandomSuffix: false //* new: for preventing auto random string after the file
        });

        // Update user with Blob URL
        await db.collection("users").updateOne(
            { _id: new ObjectId(session.userId) },
            { $set: { cvPath: blob.url } }
        );

        res.status(200).json({
            message: "CV uploaded successfully",
            cvPath: blob.url
        });
    } catch (error) {
        console.error("Error uploading CV:", error);
        res.status(500).send(error.message || "Upload failed");
    }
});


router.post('/api/addNewPlayer', async (req, res) => {
    try {
        const { count } = req.body
        const result = await db.collection("store").updateOne(
            { identifier: 'playerCount' }, // Filter
            {
                $set: { currentPlayers: count }, // Update document

            },
            { upsert: true } // Create if doesn't exist
        );

        // Get the updated document
        const updatedStore = await db.collection("store").findOne({ identifier: 'playerCount' });
        res.status(200).json({ success: true, currentPlayers: updatedStore.currentPlayers });

    } catch (error) {
        console.error('Error updating player count:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
})

router.get('/api/getCurrentPlayers', async (req, res) => {
    try {
        const allPlayers = await db.collection("store").findOne({ identifier: 'playerCount' })
        res.status(200).json({ currentPlayers: allPlayers?.currentPlayers || 0 });
    } catch (error) {
        console.error('Error fetching player count:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
})
//////////////////////////////////////////////////////////////////////? AI PART ////////////////////////////////////////////////////////////////////////////
// Serve CV files
router.get("/api/get-cv/:userId", async (req, res) => {
    try {
        const user = await db.collection("users").findOne({
            _id: new ObjectId(req.params.userId)
        });

        if (!user?.cvPath) {
            return res.status(404).json({ message: "CV not found" });
        }

        res.status(200).json({ cvPath: user.cvPath });
    } catch (error) {
        console.error("Error fetching CV:", error);
        res.status(500).json({ message: "Server error" });
    }
});


router.get("/api/getAllApplicantsByJob/:jobId", async (req, res) => {
    try {
        const { jobId } = req.params;

        // Validate ObjectId format
        if (!ObjectId.isValid(jobId)) {
            return res.status(400).json({ error: "Invalid job ID format" });
        }

        // Find the job document
        const job = await db.collection("job").findOne(
            { _id: new ObjectId(jobId) },
            { projection: { applicants: 1, application_status: 1, title: 1 } }
        );

        if (!job) {
            return res.status(404).json({ error: "Job not found" });
        }

        // If no applicants, return early
        if (!job.applicants?.length) {
            return res.status(200).json({
                jobId,
                jobTitle: job.title || "Untitled Position",
                totalApplicants: 0,
                applicants: []
            });
        }

        // Get applicant details in single query
        const applicants = await db.collection("users").find(
            { _id: { $in: job.applicants } },
            {
                projection: {
                    _id: 1,
                    username: 1,
                    email: 1,
                    experience_level: 1,
                    cv_skills: 1,
                    cvPath: 1
                }
            }
        ).toArray();

        // Map to final structure with application status
        const formattedApplicants = applicants.map(user => ({
            userId: user._id.toString(),
            name: user.username || "Anonymous Applicant",
            email: user.email,
            experience: user.experience_level || "Not specified",
            skills: user.cv_skills || [],
            status: job.application_status?.[user._id.toString()] || "pending",
            cvUrl: user.cvPath || null
        }));

        res.status(200).json({
            jobId,
            jobTitle: job.title || "Untitled Position",
            totalApplicants: formattedApplicants.length,
            applicants: formattedApplicants
        });

    } catch (error) {
        console.error("Error fetching applicants:", error);
        res.status(500).json({
            error: "Internal server error"
        });
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
