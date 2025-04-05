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

///AKH code

// import db from "../connection.js";
import { sendOtpEmail } from "../utils/sendEmail.js";
import bcrypt from 'bcrypt';


router.post("/api/register", async (req, res) => {
    const { wallet, username, email, gender } = req.body;
  
    if (!wallet || !email) {
      return res.status(400).json({ message: "Wallet and email are required." });
    }
  
    try {
      // 1️⃣ Check if email exists in UDST
      const universityUser = await db.collection("UDST").findOne({ email });
      if (!universityUser) {
        return res.status(403).json({ message: "Email not found in university database." });
      }
  
      // 2️⃣ Generate OTP & expiration time
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      const salt = await bcrypt.genSalt(10);
      const hashedOtp = await bcrypt.hash(otp, salt);
      
  
     // ✅ Extract role from UDST record
     const userRole = universityUser.user_role;
    
     // default avatar

     let gAvatarurl = 'https://models.readyplayer.me/67e1544a7f65c63ac72f55d6.glb';
     if (gender == 'girl') {
         gAvatarurl = "https://models.readyplayer.me/67228d2ba754a4d51bc05336.glb";
     }

     
    // 3️⃣ Store or update user in DB
    await db.collection("users").updateOne(
      { wallet },
      {
        $set: {
          username,
          email,
          avatarUrl: gAvatarurl,
          role: userRole, // ✅ use role from UDST
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

    res.status(200).json({ message: "OTP sent to your email. Please verify to complete registration." });
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
  
      // ✅ Call the PDCA smart contract to issue the certificate
      const txSuccess = await issueCertificate(did);
      if (!txSuccess) {
        return res.status(500).json({ message: "Certificate issuance on blockchain failed." });
      }
  
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
  
      res.status(200).json({ message: "OTP verified. Certificate issued successfully." });
  
    } catch (err) {
      console.error("OTP verification error:", err);
      res.status(500).json({ message: "Verification failed. Please try again." });
    }
  });



//AKH code


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
            // Update the isValid flag in DB if it's expired
            if (cert && cert.expiresAt < now) {
                await usersCollection.updateOne(
                    { wallet },
                    { $set: { "certificate.isValid": false } }
                );
            }
        
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

// router.post('/api/register', async (req, res) => {
//     try {
//         const { wallet, username, email, gender } = req.body;

//         if (!wallet || !email || !username || !gender) {
//             return res.status(400).json({ message: "Missing required fields." });
//         }

//         const usersCollection = db.collection('users');
//         const udstCollection = db.collection('UDST');

//         // ✅ Check if the email exists in UDST
//         const authorizedEmail = await udstCollection.findOne({ email });
//         if (!authorizedEmail) {
//             return res.status(403).json({ message: "Email not authorized. You must be a UDST student." });
//         }

//         // ✅ Extract role from UDST record
//         const userRole = authorizedEmail.user_role;

//         const existingUser = await usersCollection.findOne({ wallet });
//         if (existingUser) {
//             return res.status(400).json({ message: "Wallet is already registered." });
//         }

//         let gAvatarurl = 'https://models.readyplayer.me/67e1544a7f65c63ac72f55d6.glb';
//         if (gender == 'girl') {
//             gAvatarurl = "https://models.readyplayer.me/67228d2ba754a4d51bc05336.glb";
//         }

//         const did = `${wallet}`;
//         const validityPeriod = 365 * 24 * 60 * 60; // 1 year
//         const issuedAt = Math.floor(Date.now() / 1000);
//         const expiresAt = issuedAt + validityPeriod;

//         const success = await issueCertificate(did, validityPeriod);
//         if (!success) {
//             return res.status(500).json({ message: "Certificate issue failed." });
//         }

//         const newUser = {
//             wallet,
//             username,
//             email,
//             avatarUrl: gAvatarurl,
//             role: userRole, // ✅ use role from UDST
//             gender,
//             certificate: {
//                 did,
//                 issuedBy: "UDST",
//                 issuedAt,
//                 expiresAt,
//                 isValid: true
//             }
//         };

//         await usersCollection.insertOne(newUser);

//         res.status(201).json({ message: "Registration successful and certificate issued!" });
//     }
//     catch (error) {
//         console.error("Registration error:", error);
//         res.status(500).json({ message: "Server error during registration." });
//     }
// });

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

export default router;