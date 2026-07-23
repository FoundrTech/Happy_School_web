import { Request, Response } from "express";
import admin from "../config/firebaseAdmin";
import dotenv from "dotenv";
import { getAcademicYearRange, timestampToMs } from "../utils/academicYear";

dotenv.config();
const db = admin.firestore();

export const TicketController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const email: string = req.params.email;
  const { teacher, status, fromDate, toDate, category, academicYear } = req.query;

  try {
    const userInfoSnap = await db
      .collection("Users")
      .doc(email)
      .collection("userinfo")
      .doc("userinfo")
      .get();

    if (!userInfoSnap.exists) {
      res.status(404).json({ error: "User info not found in Firestore" });
      return;
    }

    const userData = userInfoSnap.data() as { school?: string };
    const school = userData?.school;

    if (!school) {
      res.status(404).json({ error: "School not found" });
      return;
    }

    // 2) Get the tickets
    const ticketSubColRef = db
      .collection("Tickets")
      .doc(school)
      .collection(school);
    const ticketsSnap = await ticketSubColRef.get();

    let tickets = ticketsSnap.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((t: any) => t.privacy !== true);

    if (academicYear) {
      const range = getAcademicYearRange(String(academicYear));
      if (range) {
        tickets = tickets.filter((t: any) => {
          const ms = timestampToMs(t.timestamp);
          return ms !== null && ms >= range.from.getTime() && ms <= range.to.getTime();
        });
      }
    } else if (fromDate || toDate) {
      tickets = tickets.filter((t: any) => {
        const ms = timestampToMs(t.timestamp);
        if (ms === null) return false;
        const from = fromDate ? new Date(String(fromDate)).getTime() : -Infinity;
        const to = toDate ? new Date(String(toDate)).getTime() : Infinity;
        return ms >= from && ms <= to;
      });
    }

    if (teacher) {
      tickets = tickets.filter(
        (t) => (t as any).email?.toLowerCase() === String(teacher).toLowerCase()
      );
    }

    if (status) {
      tickets = tickets.filter(
        (t) => (t as any).status?.toLowerCase() === String(status).toLowerCase()
      );
    }

    if (category) {
      tickets = tickets.filter(
        (t) =>
          (t as any).category?.toLowerCase() === String(category).toLowerCase()
      );
    }

    res.status(200).json({
      message: "Tickets fetched successfully",
      ticketCount: tickets.length,
      tickets,
    });
  } catch (e: any) {
    console.error("Error in TicketController:", e.message || e);
    res.status(500).json({ error: "Internal server error" });
  }
};
