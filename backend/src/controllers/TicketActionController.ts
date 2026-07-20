import { Request, Response } from "express";
import admin from "../config/firebaseAdmin";

const db = admin.firestore();

export const EditTicketController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { school, ticketId, ticketText, category, status, teacher, contributors, oneononesessions } = req.body;

  if (!school || !ticketId) {
    res.status(400).json({ error: "Missing school or ticketId parameter" });
    return;
  }

  try {
    const ticketRef = db
      .collection("Tickets")
      .doc(school)
      .collection(school)
      .doc(ticketId);

    const doc = await ticketRef.get();
    if (!doc.exists) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    const updateData: Record<string, any> = {};
    if (ticketText !== undefined) updateData.ticketText = ticketText;
    if (category !== undefined) updateData.category = category;
    if (status !== undefined) updateData.status = status;
    if (teacher !== undefined) updateData.teacher = teacher;
    if (contributors !== undefined) updateData.contributors = contributors;
    if (oneononesessions !== undefined) updateData.oneononesessions = oneononesessions;

    await ticketRef.update(updateData);

    res.status(200).json({ message: "Ticket updated successfully", updatedFields: updateData });
  } catch (error) {
    console.error("Error updating ticket:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const DeleteTicketController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { school, ticketId } = req.body;

  if (!school || !ticketId) {
    res.status(400).json({ error: "Missing school or ticketId parameter" });
    return;
  }

  try {
    const ticketRef = db
      .collection("Tickets")
      .doc(school)
      .collection(school)
      .doc(ticketId);

    const doc = await ticketRef.get();
    if (!doc.exists) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    await ticketRef.delete();

    res.status(200).json({ message: "Ticket deleted successfully" });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
