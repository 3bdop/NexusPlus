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
        let avatarUrl = 'https://models.readyplayer.me/67e1544a7f65c63ac72f55d6.glb'
        if (gender.toLowerCase() == 'female') {
            avatarUrl = "https://models.readyplayer.me/67228d2ba754a4d51bc05336.glb"
        }

        await usersCollection.insertOne(
            {
                wallet,
                username: username,
                email: email,
                avatarUrl,
                role: 'attendee',
                gender: gender.toLowerCase()
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
            cvUrl: blob.url
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

        res.status(200).json({ cvUrl: user.cvPath });
    } catch (error) {
        console.error("Error fetching CV:", error);
        res.status(500).json({ message: "Server error" });
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
                applicants: [],
                recommended_candidates: [],
                top_recommended_candidate: null
            });
        }

        // Get applicant details
        const usersCollection = db.collection("users");
        let applicantDetails = [];

        for (const applicantId of applicants) {
            const user = await usersCollection.findOne(
                { _id: applicantId },
                { projection: { _id: 1, username: 1, email: 1, experience: 1, skills: 1, cvPath: 1 } }
            );

            if (user) {
                // Check if CV file exists
                let hasCv = false;
                if (user.cvPath) {
                    hasCv = true
                }

                applicantDetails.push({
                    id: user._id.toString(),
                    name: user.username || "Unknown",
                    email: user.email || "No email",
                    experience: user.experience || "Not specified",
                    skills: user.skills || [],
                    has_cv: hasCv,
                    cvPath: user.cvPath
                });
            }
        }

        // Fetch recommended candidates from the recommendation API
        let recommendedCandidates = [];
        let topRecommendedCandidate = null;
        try {
            // Only attempt to get recommendations if there are applicants
            if (applicantDetails.length > 0) {
                console.log(`Fetching recommendations for job ${jobId} with ${applicantDetails.length} applicants`);

                // Make a request to the candidate recommendation API (running on port 8001)
                // Request only the top 1 candidate
                const axios = (await import('axios')).default;
                const recommendationResponse = await axios.get(
                    `https://career-fair-metaverse-p6nc.onrender.com/api/recommendations/${jobId}?top_k=1`
                );

                // Log the recommendation response for debugging
                console.log('Recommendation API response:', JSON.stringify(recommendationResponse.data, null, 2));

                // Check if there's an error in the response
                if (recommendationResponse.data && recommendationResponse.data.error) {
                    console.log(`Recommendation API returned an error: ${recommendationResponse.data.error}`);
                    // Continue without recommendations
                }
                // Check if we have any candidates in the response
                else if (recommendationResponse.data &&
                    recommendationResponse.data.candidates &&
                    recommendationResponse.data.candidates.length > 0) {

                    console.log(`Received ${recommendationResponse.data.candidates.length} recommended candidates`);

                    // Process all recommended candidates
                    const candidates = recommendationResponse.data.candidates;
                    const processedCandidates = [];
                    const recommendedIds = new Set(); // Track IDs of recommended candidates

                    for (const candidate of candidates) {
                        console.log(`Processing candidate: ${candidate.candidate_id} (${candidate.name})`);

                        // Find this candidate in our applicant details
                        let matchingApplicant = applicantDetails.find(
                            applicant => applicant.id === candidate.candidate_id
                        );

                        // If no direct match, try normalized IDs
                        if (!matchingApplicant) {
                            console.log(`No direct match for ${candidate.candidate_id}, trying normalized IDs`);
                            matchingApplicant = applicantDetails.find(applicant => {
                                const normalizedApplicantId = applicant.id.replace(/[^a-f0-9]/gi, '');
                                const normalizedCandidateId = candidate.candidate_id.toString().replace(/[^a-f0-9]/gi, '');
                                return normalizedApplicantId === normalizedCandidateId;
                            });
                        }

                        // If still no match, try by name or email
                        if (!matchingApplicant) {
                            console.log(`No ID match for ${candidate.candidate_id}, trying by name/email`);
                            matchingApplicant = applicantDetails.find(applicant => {
                                return (applicant.name && candidate.name &&
                                    applicant.name.toLowerCase() === candidate.name.toLowerCase()) ||
                                    (applicant.email && candidate.email &&
                                        applicant.email.toLowerCase() === candidate.email.toLowerCase());
                            });
                        }

                        if (matchingApplicant) {
                            console.log(`Found matching applicant: ${matchingApplicant.id} (${matchingApplicant.name})`);
                            const enhancedCandidate = {
                                ...matchingApplicant,
                                content_similarity: candidate.content_similarity,
                                experience_match: candidate.experience_match,
                                skills_match: candidate.skills_match,
                                final_score: candidate.final_score,
                                matching_skills: candidate.matching_skills || [],
                                all_skills: candidate.all_skills || []
                            };
                            processedCandidates.push(enhancedCandidate);
                            recommendedIds.add(matchingApplicant.id);
                        } else {
                            console.log(`No matching applicant found for ${candidate.candidate_id} (${candidate.name})`);
                            // Add the candidate directly if we can't find a match
                            // This ensures we don't lose recommendations
                            const candidateId = candidate.candidate_id;
                            processedCandidates.push({
                                id: candidateId,
                                name: candidate.name,
                                email: candidate.email,
                                experience: candidate.experience,
                                skills: candidate.all_skills || [],
                                has_cv: false, // Assume no CV since we couldn't match
                                content_similarity: candidate.content_similarity,
                                experience_match: candidate.experience_match,
                                skills_match: candidate.skills_match,
                                final_score: candidate.final_score,
                                matching_skills: candidate.matching_skills || [],
                                all_skills: candidate.all_skills || []
                            });
                            // Add to recommendedIds to ensure it's filtered out from the main list
                            recommendedIds.add(candidateId);
                        }
                    }

                    // Set the recommended candidates
                    recommendedCandidates = processedCandidates;
                    console.log(`Processed ${recommendedCandidates.length} recommended candidates`);

                    // Set the top recommended candidate (first in the list)
                    if (recommendedCandidates.length > 0) {
                        topRecommendedCandidate = recommendedCandidates[0];
                        console.log(`Set top recommended candidate: ${topRecommendedCandidate.id} (${topRecommendedCandidate.name})`);
                    }

                    // Filter out recommended candidates from the main applicants list
                    const originalCount = applicantDetails.length;
                    console.log(`Recommended IDs to filter out: ${Array.from(recommendedIds).join(', ')}`);
                    console.log(`Applicant IDs before filtering: ${applicantDetails.map(a => a.id).join(', ')}`);

                    applicantDetails = applicantDetails.filter(applicant => !recommendedIds.has(applicant.id));

                    console.log(`Applicant IDs after filtering: ${applicantDetails.map(a => a.id).join(', ')}`);
                    console.log(`Filtered out ${originalCount - applicantDetails.length} applicants that are in recommendations`);
                } else {
                    console.log('No recommended candidates returned from API');
                }
            } else {
                console.log('No applicants to get recommendations for');
            }
        } catch (recommendationError) {
            console.error("Error fetching candidate recommendations:", recommendationError);
            // Log more details about the error for debugging
            if (recommendationError.response) {
                console.error("Response data:", recommendationError.response.data);
                console.error("Response status:", recommendationError.response.status);
            } else if (recommendationError.request) {
                console.error("No response received from recommendation API");
            } else {
                console.error("Error setting up recommendation request:", recommendationError.message);
            }
            // Continue without recommendation if there's an error
        }

        // Log the final counts for debugging
        console.log(`Final counts: ${recommendedCandidates.length} recommended candidates, ${applicantDetails.length} other applicants`);
        if (topRecommendedCandidate) {
            console.log(`Top recommended candidate: ${topRecommendedCandidate.name} (${topRecommendedCandidate.id})`);
        }

        return res.status(200).json({
            job_id: jobId,
            job_title: job.title || "Unknown Job",
            applicant_count: applicantDetails.length + recommendedCandidates.length,
            applicants: applicantDetails,
            recommended_candidates: recommendedCandidates,
            top_recommended_candidate: topRecommendedCandidate
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