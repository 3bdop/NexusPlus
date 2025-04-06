import { ObjectId } from "mongodb";
import db from "../db/connection.js"

const validateSession = async (req, res, next) => {
    try {
        const sessionId = req.cookies.sessionId;

        if (!sessionId) {
            return res.status(401).json({
                authenticated: false,
                message: "No session found"
            });
        }

        const sessionsCollection = db.collection('session');
        const session = await sessionsCollection.findOne({
            sessionId,
            expiresAt: { $gt: new Date() }
        });

        if (!session) {
            res.clearCookie('sessionId');
            return res.status(401).json({
                authenticated: false,
                message: "Invalid or expired session"
            });
        }

        // 2. Verify user exists
        const user = await db.collection('users').findOne({
            _id: new ObjectId(session.userId)
        });

        if (!user) {
            await db.collection('sessions').deleteOne({ sessionId });
            res.clearCookie('sessionId');
            return res.status(401).json({ authenticated: false });
        }

        // req.user = session; //! old
        // 3. Attach normalized user data
        req.user = {
            id: user._id,  // Now using proper ObjectId
            role: user.role,
            username: user.username
        };
        next();
    } catch (error) {
        console.error('Session validation error:', error);
        res.status(500).json({
            authenticated: false,
            message: "Error validating session"
        });
    }
};

export default validateSession;