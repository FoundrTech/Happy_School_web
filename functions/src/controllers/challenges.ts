/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */

import {Router, Request, Response} from "express";
import {db} from "../config/firebase";
// eslint-disable-next-line new-cap
const router = Router();

/**
 * Each challenge ID in ChallengeNames is a Unix timestamp (ms) of when the
 * challenge was created. Academic year: June 1 of startYear → April 30 of endYear.
 * Matches the filtering logic in the Flutter app (MainHome.dart / pastChallenges.dart).
 */
function getAcademicYearMs(academicYear: string): {startMs: number; endMs: number} | null {
  const match = academicYear.match(/^(\d{4})-(\d{2,4})$/);
  if (!match) return null;
  const startYear = parseInt(match[1], 10);
  const suffix = match[2];
  const endYear = suffix.length === 2
    ? Math.floor(startYear / 100) * 100 + parseInt(suffix, 10)
    : parseInt(suffix, 10);
  const startMs = new Date(startYear, 5, 1, 0, 0, 0, 0).getTime();     // June 1
  const endMs = new Date(endYear, 3, 30, 23, 59, 59, 999).getTime();   // April 30
  return {startMs, endMs};
}

router.get("/challenges/:school", async (req: Request, res: Response) => {
  const {school} = req.params;
  const {academicYear} = req.query as {academicYear?: string};

  if (!school) {
    res.status(400).json({error: "School name is required"});
    return;
  }

  try {
    const docRef = db
      .collection("Content")
      .doc("Content")
      .collection(school)
      .doc(school)
      .collection("ChallengeNames")
      .doc("ChallengeNames");

    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      res.status(404).json({error: "No challenges found for the school"});
      return;
    }

    const allChallenges = docSnap.data() as Record<string, string> | undefined;

    if (!allChallenges) {
      res.status(404).json({error: "No challenges found for the school"});
      return;
    }

    // Filter by academic year if provided — challenge IDs are epoch ms timestamps
    let challenges: Record<string, string>;
    if (academicYear) {
      const range = getAcademicYearMs(academicYear);
      if (range) {
        challenges = {};
        for (const [id, name] of Object.entries(allChallenges)) {
          const idMs = parseInt(id, 10);
          if (!isNaN(idMs) && idMs >= range.startMs && idMs <= range.endMs) {
            challenges[id] = name;
          }
        }
      } else {
        challenges = allChallenges;
      }
    } else {
      challenges = allChallenges;
    }

    res.status(200).json({
      message: "Challenges fetched successfully",
      school,
      challenges,
    });
  } catch (error: any) {
    console.error("Error fetching challenges:", error.message);
    res.status(500).json({error: "Failed to retrieve challenges"});
  }
});

export default router;
