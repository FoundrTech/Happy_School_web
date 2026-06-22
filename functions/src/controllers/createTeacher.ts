/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */

import { Router, Request, Response } from "express";
import admin from "../config/firebase";
import { Resend } from "resend";
import { WEB_API_KEY } from "./login";

// ── Change sender to your verified Resend domain when ready ──────────────────
const RESEND_FROM = "Happy School <onboarding@resend.dev>";
const resendClient = new Resend("re_6SQQ5ErB_MzGqamnMpsXshwiBdnNSzfvj");
// ─────────────────────────────────────────────────────────────────────────────

const db = admin.firestore();
const auth = admin.auth();

// eslint-disable-next-line new-cap
const router = Router();

function welcomeEmailHtml(
  name: string,
  school: string,
  resetLink: string,
): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif">
  <div style="max-width:540px;margin:32px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
    <div style="background:#ea580c;padding:28px 24px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:.5px">Happy School</h1>
    </div>
    <div style="padding:36px 32px">
      <h2 style="margin-top:0;color:#1a1a1a;font-size:20px">Welcome, ${name}!</h2>
      <p style="color:#555;line-height:1.7;margin-top:8px">
        You've been added as a teacher at <strong style="color:#ea580c">${school}</strong>
        on the Happy School platform.
      </p>
      <p style="color:#555;line-height:1.7">
        Click the button below to set your password and start your journey.
      </p>
      <div style="text-align:center;margin:36px 0">
        <a href="${resetLink}"
           style="display:inline-block;background:#ea580c;color:#fff;text-decoration:none;
                  padding:14px 36px;border-radius:8px;font-weight:bold;font-size:16px">
          Set Your Password →
        </a>
      </div>
      <p style="color:#999;font-size:13px;line-height:1.6">
        This link expires in <strong>24 hours</strong>.
        If you didn't expect this email, you can safely ignore it.
      </p>
    </div>
    <div style="background:#fafafa;border-top:1px solid #eee;padding:18px 24px;text-align:center">
      <p style="color:#bbb;font-size:12px;margin:0">
        © Happy School &nbsp;·&nbsp; Sent to teachers of ${school}
      </p>
    </div>
  </div>
</body>
</html>`;
}

router.post(
  "/create-teacher",
  async (req: Request, res: Response): Promise<void> => {
    const { email, name, coordinator, department, school, coins } = req.body;

    if (!email || !name || !school) {
      res.status(400).json({ error: "email, name, and school are required" });
      return;
    }

    const normalizedEmail = (email as string).toLowerCase().trim();

    try {
      // 1. Create Firebase Auth user with a temporary random password
      await auth.createUser({
        email: normalizedEmail,
        password: Math.random().toString(36).substring(2, 10),
      });

      // 2. Write Firestore documents
      const batch = db.batch();
      const userRef = db.collection("Users").doc(normalizedEmail);
      const userInfoRef = userRef.collection("userinfo").doc("userinfo");
      const schoolUserRef = db
        .collection("SchoolUsers")
        .doc(school)
        .collection("Users")
        .doc(normalizedEmail);

      const userEntry = {
        Name: name,
        email: normalizedEmail,
        department: department || "",
        coordinator: coordinator || "",
        school,
        coins: coins ?? 0,
        role: "teacher",
        phone: "",
        courses: [],
      };

      batch.set(userRef, {});
      batch.set(userInfoRef, userEntry);
      batch.set(schoolUserRef, {
        email: normalizedEmail,
        role: "teacher",
        Name: name,
        coins: coins ?? 0,
      });
      await batch.commit();

      // 3. Update school user count
      try {
        const schoolQuery = await db
          .collection("Schools")
          .where("SchoolName", "==", school)
          .limit(1)
          .get();
        if (!schoolQuery.empty) {
          await schoolQuery.docs[0].ref.update({
            UsersCount: admin.firestore.FieldValue.increment(1),
          });
        }
      } catch (schoolErr: any) {
        console.error("Failed to update school count:", schoolErr.message);
      }

      // ─── EMAIL: Resend (ACTIVE) ───────────────────────────────────────────
      try {
        const resetLink = await admin
          .auth()
          .generatePasswordResetLink(normalizedEmail);
        const {data, error: resendError} = await resendClient.emails.send({
          from: RESEND_FROM,
          to: normalizedEmail,
          subject: "Welcome to Happy School — Set Your Password",
          html: welcomeEmailHtml(name as string, school as string, resetLink),
        });
        if (resendError) {
          console.error("Resend error:", JSON.stringify(resendError));
        } else {
          console.log("Resend email sent, id:", data?.id);
        }
      } catch (emailErr: any) {
        console.error("Failed to send welcome email:", emailErr.message);
      }
      // ─────────────────────────────────────────────────────────────────────

      // ─── EMAIL: Firebase password reset (INACTIVE — swap back if needed) ─
      if (false) {
        const apiKey = WEB_API_KEY.value();
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const axios = require("axios");
        await axios.post(
          `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
          { requestType: "PASSWORD_RESET", email: normalizedEmail },
        );
      }
      // ─────────────────────────────────────────────────────────────────────

      res.status(201).json({
        message: "Teacher created successfully",
        email: normalizedEmail,
      });
    } catch (err: any) {
      console.error("Error creating teacher:", err.message);

      // If Firestore wrote but auth failed, or vice versa, surface the real error
      if (err.code === "auth/email-already-exists") {
        res
          .status(409)
          .json({ error: "A user with this email already exists" });
        return;
      }

      res
        .status(500)
        .json({ error: err.message || "Failed to create teacher" });
    }
  },
);

export default router;
