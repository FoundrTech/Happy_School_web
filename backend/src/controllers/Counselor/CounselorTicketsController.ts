import { Request, Response } from "express";
import admin from "../../config/firebaseAdmin";
import dotenv from "dotenv";
import { timestampToMs } from "../../utils/academicYear";

dotenv.config();
const db = admin.firestore();

export const CounselorTicketController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const email: string = req.params.email;
  const { teacher, status, fromDate, toDate, category } = req.query;

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

    const userData = userInfoSnap.data();
    const schools: string[] = userData?.schools;

    if (!schools || !Array.isArray(schools) || schools.length === 0) {
      res.status(404).json({ error: "No schools found for this user" });
      return;
    }

    const allTicketsArrays = await Promise.all(
      schools.map(async (school) => {
        const ticketSubColRef = db
          .collection("Tickets")
          .doc(school)
          .collection(school);

        const ticketsSnap = await ticketSubColRef.get();

        const tickets = ticketsSnap.docs.map((doc) => ({
          id: doc.id,
          school,
          ...doc.data(),
        }));
        return tickets;
      })
    );

    let tickets = allTicketsArrays.flat();

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

    if (fromDate || toDate) {
      tickets = tickets.filter((t) => {
        const ms = timestampToMs((t as any).timestamp);
        if (ms === null) return false;

        const from = fromDate
          ? new Date(String(fromDate)).getTime()
          : -Infinity;
        const to = toDate ? new Date(String(toDate)).getTime() : Infinity;

        return ms >= from && ms <= to;
      });
    }

    tickets.sort((a: any, b: any) => {
      const msA = timestampToMs(a.timestamp) ?? 0;
      const msB = timestampToMs(b.timestamp) ?? 0;
      return msB - msA;
    });

    res.status(200).json({
      message: "Tickets fetched successfully",
      totalTickets: tickets.length,
      tickets,
    });
  } catch (e: any) {
    res.status(500).json({ error: "Internal server error" });
  }
};
