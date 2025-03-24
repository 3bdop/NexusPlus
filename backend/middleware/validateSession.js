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

        req.user = session;
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