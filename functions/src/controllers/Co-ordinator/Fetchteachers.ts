/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */
import {Request, Response} from "express";
import admin from "../../config/firebase";
import {shortToLongAcademicYear} from "../../utils/academicYear";

const db = admin.firestore();

export const fetchteachers = async (
  req: Request,
  res: Response
): Promise<void> => {
  const {wingId} = req.params;
  const {academicYear} = req.query as {academicYear?: string};

  if (!wingId) {
    res.status(400).json({error: "Wing ID is required"});
    return;
  }

  try {
    // Query all teacher userinfo docs by wingId
    const teachersSnap = await db
      .collectionGroup("userinfo")
      .where("role", "==", "teacher")
      .where("wingId", "==", wingId)
      .get();

    if (teachersSnap.empty) {
      res.status(404).json({
        error: "No teachers found for this wing",
      });
      return;
    }

    const rawTeachers = teachersSnap.docs.map((doc) => ({
      userId: doc.ref.parent.parent?.id,
      ...doc.data(),
    })) as any[];

    // Build name → points map from yearlyReports when academicYear is provided
    const pointsMap = new Map<string, number>();
    if (academicYear) {
      const school = rawTeachers[0]?.school as string | undefined;
      if (school) {
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
    }

    const teachers = rawTeachers
      .map((t) => {
        const nameKey = ((t.Name as string) || "").trim().toLowerCase();
        const coins = academicYear
          ? (pointsMap.get(nameKey) ?? 0)
          : (t.coins ?? 0);
        return {...t, coins};
      })
      .sort((a, b) => (b.coins ?? 0) - (a.coins ?? 0));

    res.status(200).json({
      message: "Teachers fetched successfully",
      wingId,
      totalTeachers: teachers.length,
      teachers,
    });
  } catch (error: any) {
    console.error("Error fetching teachers:", error.message || error);
    res.status(500).json({error: "Internal server error"});
  }
};
