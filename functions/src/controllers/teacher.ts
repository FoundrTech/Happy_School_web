// functions/src/controllers/teacherController.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */

import {Request, Response} from "express";
import admin from "../config/firebase";
import {shortToLongAcademicYear} from "../utils/academicYear";

const db = admin.firestore();

export const teacher = async (req: Request, res: Response): Promise<void> => {
  const email: string = req.params.email;
  const {academicYear} = req.query as {academicYear?: string};

  try {
    const snapshot = await db
      .collection("Users")
      .doc(email)
      .collection("userinfo")
      .doc("userinfo")
      .get();

    if (!snapshot.exists) {
      res.status(404).json({error: "User info not found in Firestore"});
      return;
    }

    const userData = snapshot.data() as { school?: string };
    const school = userData.school;

    if (!school) {
      console.error("school not found");
      res.status(404).json({error: "school not found"});
      return;
    }

    const techSnapshot = await db
      .collection("SchoolUsers")
      .doc(school)
      .collection("Users")
      .get();

    const teacherIds: string[] = techSnapshot.docs.map((doc) => doc.id);

    if (teacherIds.length === 0) {
      res.status(404).json({error: "No teachers found"});
      return;
    }

    // Build name → points map from yearlyReports when academicYear is provided
    const pointsMap = new Map<string, number>();
    if (academicYear) {
      const longYear = shortToLongAcademicYear(academicYear);
      const reportsSnap = await db
        .collection("yearlyReports")
        .where("school", "==", school)
        .where("academicYear", "==", longYear)
        .get();
      reportsSnap.docs.forEach((doc) => {
        const d = doc.data();
        if (d.name && typeof d.points === "number") {
          pointsMap.set((d.name as string).trim().toLowerCase(), d.points);
        }
      });
    }

    const teacherData = await Promise.all(
      teacherIds.map(async (id) => {
        const docRef = db
          .collection("Users")
          .doc(id)
          .collection("userinfo")
          .doc("userinfo");

        const docSnap = await docRef.get();
        if (!docSnap.exists) return null;

        const data = docSnap.data() as any;
        const nameKey = ((data?.Name as string) || "").trim().toLowerCase();
        const coins = academicYear
          ? (pointsMap.get(nameKey) ?? 0)
          : (data?.coins ?? 0);

        return {id, ...data, coins};
      })
    );

    const filteredTeacherData = (teacherData.filter(Boolean) as any[])
      .sort((a, b) => (b.coins ?? 0) - (a.coins ?? 0));

    res.status(200).json({
      message: "Teachers fetched successfully",
      teachers: filteredTeacherData,
      noOfTechers: filteredTeacherData.length,
    });
  } catch (e: any) {
    console.error("Error in fetching teachers:", e.message);
    res.status(500).json({error: "Server error"});
  }
};

export const bulkCreate = async (req: Request, res: Response): Promise<void> => {
  const { users, schoolName, courses } = req.body;

  if (!users || !Array.isArray(users) || !schoolName) {
    res.status(400).json({ error: "Missing required fields: users, schoolName" });
    return;
  }

  const createdEmails: string[] = [];
  const failedUsers: any[] = [];

  let batch = db.batch();
  let opCount = 0;
  let newlyAddedCount = 0;

  for (const user of users) {
    const email = user.email.toLowerCase().trim();
    const name = user.name || "";
    const coins = user.coins || 0;

    try {
      // 1. Create Auth User
      await admin.auth().createUser({
        email: email,
        password: Math.random().toString(36).substring(2, 10),
      });

      // 2. Prepare Firestore Writes
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

      if (opCount >= 450) {
        await batch.commit();
        batch = db.batch();
        opCount = 0;
      }
    } catch (err: any) {
      console.error(`Failed to create user ${email}:`, err);
      failedUsers.push({ email, error: err.message });
    }
  }

  if (opCount > 0) {
    await batch.commit();
  }

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

  res.status(200).json({
    success: true,
    createdCount: newlyAddedCount,
    createdEmails: createdEmails,
    failedUsers: failedUsers,
  });
};

export const deleteTeacher = async (req: Request, res: Response): Promise<void> => {
  const email: string = req.params.email.toLowerCase().trim();

  try {
    // 1. Get user by email to ensure they exist in Auth
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch (authErr: any) {
      console.log(`User ${email} not found in Auth, continuing Firestore cleanup:`, authErr.message);
    }

    // 2. Fetch user's school info to update school counts
    const userInfoDoc = await db
      .collection("Users")
      .doc(email)
      .collection("userinfo")
      .doc("userinfo")
      .get();

    let schoolName: string | null = null;
    if (userInfoDoc.exists) {
      schoolName = userInfoDoc.data()?.school || null;
    }

    // 3. Delete from Firebase Auth if found
    if (userRecord) {
      await admin.auth().deleteUser(userRecord.uid);
    }

    // 4. Delete Firestore documents (using batches)
    const batch = db.batch();

    // Delete Users/{email}/userinfo/userinfo
    const userInfoRef = db.collection("Users").doc(email).collection("userinfo").doc("userinfo");
    batch.delete(userInfoRef);

    // Delete Users/{email}
    const userRef = db.collection("Users").doc(email);
    batch.delete(userRef);

    // Delete SchoolUsers/{schoolName}/Users/{email}
    if (schoolName) {
      const schoolUserRef = db
        .collection("SchoolUsers")
        .doc(schoolName)
        .collection("Users")
        .doc(email);
      batch.delete(schoolUserRef);

      // Decrement UsersCount in Schools collection
      try {
        const schoolQuery = await db
          .collection("Schools")
          .where("SchoolName", "==", schoolName)
          .limit(1)
          .get();

        if (!schoolQuery.empty) {
          const schoolDoc = schoolQuery.docs[0];
          batch.update(schoolDoc.ref, {
            UsersCount: admin.firestore.FieldValue.increment(-1),
          });
        }
      } catch (schoolErr: any) {
        console.error("Failed to update school user count on delete:", schoolErr.message);
      }
    }

    // Commit batch
    await batch.commit();

    res.status(200).json({
      success: true,
      message: `User ${email} deleted successfully.`,
    });
  } catch (err: any) {
    console.error(`Error deleting user ${email}:`, err);
    res.status(500).json({ error: err.message || "Failed to delete user." });
  }
};
