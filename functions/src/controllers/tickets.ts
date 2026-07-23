/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */

import {Request, Response} from "express";
import admin from "../config/firebase";

const db = admin.firestore();

export const ticket = async (req: Request, res: Response): Promise<void> => {
  const email: string = req.params.email;

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

    const userData = userInfoSnap.data() as { school?: string };
    const school = userData?.school;

    if (!school) {
      console.error("School not found");
      res.status(404).json({error: "School not found"});
      return;
    }

    // 2) Access the Tickets/<school>/... subcollection
    const ticketSubColRef = db
      .collection("Tickets")
      .doc(school)
      .collection(school);

    const ticketsSnap = await ticketSubColRef
      .orderBy("timestamp", "desc")
      .get();

    const tickets = ticketsSnap.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((t: any) => t.privacy !== true);

    res.status(200).json({
      message: "Tickets fetched successfully",
      ticketCount: tickets.length,
      tickets,
    });
  } catch (e: any) {
    console.error("Error in TicketController:", e.message || e);
    res.status(500).json({error: "Internal server error"});
  }
};

export const editTicket = async (req: Request, res: Response): Promise<void> => {
  const {school, ticketId, ticketText, category, status, teacher, contributors, oneononesessions} = req.body;

  if (!school || !ticketId) {
    res.status(400).json({error: "Missing school or ticketId parameter"});
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
      res.status(404).json({error: "Ticket not found"});
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

    res.status(200).json({message: "Ticket updated successfully", updatedFields: updateData});
  } catch (error: any) {
    console.error("Error updating ticket:", error);
    res.status(500).json({error: "Internal server error"});
  }
};

export const deleteTicket = async (req: Request, res: Response): Promise<void> => {
  const {school, ticketId} = req.body;

  if (!school || !ticketId) {
    res.status(400).json({error: "Missing school or ticketId parameter"});
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
      res.status(404).json({error: "Ticket not found"});
      return;
    }

    await ticketRef.delete();

    res.status(200).json({message: "Ticket deleted successfully"});
  } catch (error: any) {
    console.error("Error deleting ticket:", error);
    res.status(500).json({error: "Internal server error"});
  }
};
