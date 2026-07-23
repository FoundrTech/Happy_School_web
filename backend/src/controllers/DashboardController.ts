import { Request, Response } from "express";
import admin from "../config/firebaseAdmin";
import dotenv from "dotenv";
import { getAcademicYearRange, timestampToMs } from "../utils/academicYear";

dotenv.config();
const db = admin.firestore();

export const getDashboardSummary = async (
  req: Request,
  res: Response
): Promise<void> => {
  const email = req.params.email;
  const { academicYear } = req.query;

  try {
    // Step 1: Fetch user school info
    const userDocSnap = await db
      .collection("Users")
      .doc(email)
      .collection("userinfo")
      .doc("userinfo")
      .get();

    if (!userDocSnap.exists) {
      res.status(404).json({ error: "User info not found in Firestore" });
      return;
    }

    const school = userDocSnap.data()?.school;
    if (!school) {
      res.status(404).json({ error: "School not found" });
      return;
    }

    const ticketsRef = db.collection("Tickets").doc(school).collection(school);
    const schoolQueryRef = db
      .collection("Schools")
      .where("SchoolName", "==", school)
      .limit(1);

    // Step 2: Parallel Firestore queries
    const [schoolSnapshot, allTicketsSnap] = await Promise.all([
      schoolQueryRef.get(),
      ticketsRef.get(),
    ]);

    if (schoolSnapshot.empty) {
      res.status(404).json({ error: "School not found in Schools collection" });
      return;
    }

    const schoolData = schoolSnapshot.docs[0].data();

    // Step 3: Build year range filter if provided
    const range = academicYear ? getAcademicYearRange(String(academicYear)) : null;

    // Step 4: Calculate stats, applying academic year filter on timestamps
    let totalSessionsValue = 0;
    let earlyAdopterCount = 0;

    allTicketsSnap.docs.forEach((doc) => {
      const data = doc.data();

      if (range) {
        const ms = timestampToMs(data.timestamp);
        if (ms === null || ms < range.from.getTime() || ms > range.to.getTime()) {
          return; // skip tickets outside the academic year
        }
      }

      if (data.oneononesessions && typeof data.oneononesessions === "number") {
        totalSessionsValue += data.oneononesessions;
      }

      if (data.category === "Early Adopter") {
        earlyAdopterCount++;
      }
    });

    // Step 5: Return combined summary
    res.status(200).json({
      school,
      academicYear: academicYear || "all",
      postCount: schoolData.Posts ?? 0,
      meetingTicketCount: totalSessionsValue,
      earlyAdopterCount,
      taskscount: schoolData.Tasks ?? 0,
      sessions: totalSessionsValue,
    });
  } catch (error: any) {
    console.error("Error in getDashboardSummary:", error.message || error);
    res.status(500).json({ error: "Internal server error" });
  }
};