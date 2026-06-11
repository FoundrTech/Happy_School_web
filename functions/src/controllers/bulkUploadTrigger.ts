import {onDocumentCreated} from "firebase-functions/v2/firestore";
import admin from "../config/firebase";
import axios from "axios";
import {WEB_API_KEY} from "./login";

const db = admin.firestore();
const auth = admin.auth();

export const processBulkUpload = onDocumentCreated({
  document: "BulkUploads/{uploadId}",
  secrets: [WEB_API_KEY],
}, async (event) => {
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

      // 2. Send password reset email
      if (apiKey) {
        try {
          await axios.post(
            `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
            {
              requestType: "PASSWORD_RESET",
              email,
            }
          );
        } catch (err: any) {
          console.error(`Failed to send reset email to ${email}:`, err.message);
        }
      }

      // 3. Prepare Firestore Writes
      const userRef = db.collection("Users").doc(email);
      const userInfoRef = userRef.collection("userinfo").doc("userinfo");
      const schoolUserRef = db.collection("SchoolUsers").doc(schoolName).collection("Users").doc(email);

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
});
