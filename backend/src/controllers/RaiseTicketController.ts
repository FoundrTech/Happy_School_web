import { Request, Response } from "express";
import admin from "../config/firebaseAdmin"; // Adjust path if needed

const db = admin.firestore();

export const RaiseTicketController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const email: string = req.params.email;
  const {
    ticketText,
    teacher,
    contributors,
    category,
  }: {
    ticketText: string;
    teacher: string;
    contributors: { name: string; email: string }[];
    category: string;
  } = req.body;

  try {
    // Get user info
    const snapshot = await db
      .collection("Users")
      .doc(email)
      .collection("userinfo")
      .doc("userinfo")
      .get();

    if (!snapshot.exists) {
      res.status(404).json({ error: "User info not found in Firestore" });
      return;
    }

    const userData = snapshot.data() as { school?: string; Name?: string };
    const school = userData.school;
    const userName = userData.Name;
    const userRecord = await admin.auth().getUserByEmail(email);
const uid = userRecord.uid;

    if (!school) {
      res.status(400).json({ error: "School not found for the user" });
      return;
    }

    const status = req.body.isDraft || req.body.status === "Draft" ? "Draft" : (req.body.status || "Ticket Raised");

    const ticketData: any = {
      ticketText: ticketText || "",
      userName: userName || "",
      email,
      uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      oneononesessions: 0,
      reply: "",
      status,
      tocken: 0,
      school,
      contributors: contributors || [],
      category,
      privacy: req.body.privacy ?? false,
    };

    if (category === "Teacher") {
      ticketData.teacher = teacher || "";
    }
    const schoolTicketRef = db
      .collection("Tickets")
      .doc(school)
      .collection(school)
      .doc();

    await schoolTicketRef.set(ticketData);
    const schoolTicketCountRef = await db
      .collection("Schools")
      .where("SchoolName", "==", school)
      .limit(1)
      .get();

    if (schoolTicketCountRef.empty) {
      res.status(404).json({ error: "School not found" });
      return;
    }
    const doc = schoolTicketCountRef.docs[0];

    await db
      .collection("Schools")
      .doc(doc.id)
      .update({
        ticketsraised: admin.firestore.FieldValue.increment(1),
      });
    res.status(200).json({
      message: "Ticket raised successfully",
      ticketData,
    });
  } catch (e) {
    console.error("Error in RaiseTicketController:", e);
    res.status(500).json({ error: "Internal server error" });
  }
};
