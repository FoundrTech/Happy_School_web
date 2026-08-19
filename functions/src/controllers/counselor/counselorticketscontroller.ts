/* eslint-disable @typescript-eslint/no-explicit-any */
import {Request, Response} from "express";
import admin from "../../config/firebase";
const db = admin.firestore();

export const counselorticketcontroller = async (
  req: Request,
  res: Response
): Promise<void> => {
  const email: string = req.params.email;
  const {teacher, status, fromDate, toDate, category} = req.query;

  try {
    const userInfoSnap = await db
      .collection("Users")
      .doc(email)
      .collection("userinfo")
      .doc("userinfo")
      .get();

    if (!userInfoSnap.exists) {
      res.status(404).json({error: "User info not found in Firestore"});
      return;
    }

    const userData = userInfoSnap.data();
    const schools: string[] = userData?.schools;

    if (!schools || !Array.isArray(schools) || schools.length === 0) {
      res.status(404).json({error: "No schools found for this user"});
      return;
    }

    const allTicketsArrays = await Promise.all(
      schools.map(async (school) => {
        const ticketSubColRef = db
          .collection("Tickets")
          .doc(school)
          .collection(school);

        const ticketsSnap = await ticketSubColRef.get();

        const tickets = ticketsSnap.docs.map(
          (doc: { id: any; data: () => any }) => ({
            id: doc.id,
            school,
            ...doc.data(),
          })
        );
        return tickets;
      })
    );

    let tickets = allTicketsArrays.flat();

    if (teacher) {
      tickets = tickets.filter(
        (t: any) =>
          (t as any).email?.toLowerCase() === String(teacher).toLowerCase()
      );
    }

    if (status) {
      tickets = tickets.filter(
        (t: any) =>
          (t as any).status?.toLowerCase() === String(status).toLowerCase()
      );
    }

    if (category) {
      tickets = tickets.filter(
        (t: any) =>
          (t as any).category?.toLowerCase() === String(category).toLowerCase()
      );
    }

    if (fromDate || toDate) {
      tickets = tickets.filter((t: any) => {
        const timeStr = (t as any).timestamp;
        if (!timeStr) return false;
        const time = new Date(timeStr).getTime();

        const from = fromDate ?
          new Date(String(fromDate)).getTime() :
          -Infinity;
        const to = toDate ? new Date(String(toDate)).getTime() : Infinity;

        return time >= from && time <= to;
      });
    }

    tickets.sort((a: any, b: any) => {
      const getMs = (item: any) => {
        if (!item?.timestamp) return 0;
        if (typeof item.timestamp === "object" && item.timestamp._seconds) return item.timestamp._seconds * 1000;
        const ms = new Date(item.timestamp).getTime();
        return isNaN(ms) ? 0 : ms;
      };
      return getMs(b) - getMs(a);
    });

    res.status(200).json({
      message: "Tickets fetched successfully",
      totalTickets: tickets.length,
      tickets,
    });
  } catch (e: any) {
    res.status(500).json({error: "Internal server error"});
  }
};
