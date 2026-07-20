import express, { Request, Response } from "express";
import axios from "axios";
import dotenv from "dotenv";
import { auth } from "firebase-admin";

dotenv.config();

const router = express.Router();

interface SendResetEmailBody {
    email: string;
}

router.post(
    "/send-reset-email",
    async (
        req: Request<{}, {}, SendResetEmailBody>,
        res: Response
    ): Promise<void> => {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ error: "Email is required" });
            return;
        }

        const apiKey = process.env.firebaseAPIKey;

        if (!apiKey) {
            res.status(500).json({
                error: "Firebase API key is missing in environment variables",
            });
            return;
        }

        try {
            // 🔍 STEP 1: Check if user exists in Firebase
            let userRecord;
            try {
                userRecord = await auth().getUserByEmail(email);
            } catch (err: any) {
                if (err.code === "auth/user-not-found") {
                    res.status(404).json({ error: "No account found with this email" });
                    return;
                }
                throw err;
            }

            // 📧 STEP 2: Send password reset email
            const resetResponse = await axios.post(
                `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
                {
                    requestType: "PASSWORD_RESET",
                    email,
                }
            );

            res.status(200).json({
                message: "Password reset email sent successfully",
                uid: userRecord.uid,
            });
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.error?.message ||
                error.message ||
                "Firebase request failed";

            res.status(400).json({ error: errorMessage });
            return;
        }
    }
);

export default router;
