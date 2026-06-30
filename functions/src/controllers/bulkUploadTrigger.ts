import { onDocumentCreated } from "firebase-functions/v2/firestore";
import admin from "../config/firebase";
import axios from "axios";
import { WEB_API_KEY } from "./login";
import { Resend } from "resend";

// ── Change sender to your verified Resend domain when ready ──────────────────
const RESEND_FROM = "Happy School <info@happyschoolculture.com>";
const resendClient = new Resend("re_6SQQ5ErB_MzGqamnMpsXshwiBdnNSzfvj");
// ─────────────────────────────────────────────────────────────────────────────

function bulkWelcomeEmailHtml(
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
      <hr style="border:none;border-top:1px solid #eee;margin:28px 0">
      <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 12px">
        Download the Happy School app to get started:
      </p>
      <a href="https://play.google.com/store/apps/details?id=com.happyschoolculture.happy_school"
         style="display:inline-block;text-decoration:none">
        <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
             alt="Get it on Google Play"
             style="height:48px;border-radius:6px">
      </a>
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

const db = admin.firestore();
const auth = admin.auth();

export const processBulkUpload = onDocumentCreated(
  {
    document: "BulkUploads/{uploadId}",
    secrets: [WEB_API_KEY],
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const data = snapshot.data();
    const { users, schoolName, courses } = data;
    if (!users || !Array.isArray(users) || !schoolName) {
      await snapshot.ref.update({
        status: "failed",
        error: "Missing required fields: users, schoolName",
      });
      return;
    }

    // Set initial status to processing
    await snapshot.ref.update({
      status: "processing",
      processedCount: 0,
      totalCount: users.length,
    });

    const apiKey = WEB_API_KEY.value();
    const createdEmails: string[] = [];
    const failedUsers: any[] = [];

    let batch = db.batch();
    let opCount = 0;
    let newlyAddedCount = 0;

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const email = user.email.toLowerCase().trim();
      const name = user.name || "";
      const coins = user.coins || 0;

      try {
        // 1. Create Auth User on the backend
        await auth.createUser({
          email: email,
          password: Math.random().toString(36).substring(2, 10), // Temporary random password
        });

        // 2. Send welcome email

        // ─── EMAIL: Resend (ACTIVE) ─────────────────────────────────────────
        try {
          const resetLink = await auth.generatePasswordResetLink(email);
          await resendClient.emails.send({
            from: RESEND_FROM,
            to: email,
            subject: "Welcome to Happy School — Set Your Password",
            html: bulkWelcomeEmailHtml(name, schoolName, resetLink),
          });
        } catch (err: any) {
          console.error(
            `Failed to send Resend email to ${email}:`,
            err.message,
          );
        }
        // ───────────────────────────────────────────────────────────────────

        // ─── EMAIL: Firebase password reset (INACTIVE — swap back if needed) ─
        if (false) {
          if (apiKey) {
            await axios.post(
              `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
              { requestType: "PASSWORD_RESET", email },
            );
          }
        }
        // ───────────────────────────────────────────────────────────────────

        // 3. Prepare Firestore Writes
        const userRef = db.collection("Users").doc(email);
        const userInfoRef = userRef.collection("userinfo").doc("userinfo");
        const schoolUserRef = db
          .collection("SchoolUsers")
          .doc(schoolName)
          .collection("Users")
          .doc(email);

        const userEntry = {
          Name: name,
          email: email,
          department: "",
          coordinator: "",
          school: schoolName,
          coins: coins,
          role: "teacher",
          phone: "",
          courses: courses || [],
        };

        batch.set(userRef, {});
        batch.set(userInfoRef, userEntry);
        batch.set(schoolUserRef, {
          email: email,
          role: "teacher",
          Name: name,
          coins: coins,
        });

        opCount += 3;
        newlyAddedCount++;
        createdEmails.push(email);

        // Commit the batch if we approach Firestore's 500-operation limit
        if (opCount >= 450) {
          await batch.commit();
          batch = db.batch();
          opCount = 0;
        }
      } catch (err: any) {
        console.error(`Failed to create user ${email}:`, err);
        failedUsers.push({ email: email, error: err.message });
      }

      // Update progress in Firestore every 10 users to keep the user updated in real-time
      const currentProcessed = i + 1;
      if (currentProcessed % 10 === 0 || currentProcessed === users.length) {
        await snapshot.ref.update({
          processedCount: currentProcessed,
        });
      }
    }

    // Commit any remaining database operations
    if (opCount > 0) {
      await batch.commit();
    }

    // 4. Update the school's total user count in a single write
    if (newlyAddedCount > 0) {
      try {
        const schoolQuery = await db
          .collection("Schools")
          .where("SchoolName", "==", schoolName)
          .limit(1)
          .get();

        if (!schoolQuery.empty) {
          const schoolDoc = schoolQuery.docs[0];
          await schoolDoc.ref.update({
            UsersCount: admin.firestore.FieldValue.increment(newlyAddedCount),
          });
        }
      } catch (schoolErr: any) {
        console.error("Failed to update school user count:", schoolErr.message);
      }
    }

    // 5. Mark document as completed
    await snapshot.ref.update({
      status: failedUsers.length === users.length ? "failed" : "completed",
      createdEmails: createdEmails,
      failedUsers: failedUsers,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  },
);
