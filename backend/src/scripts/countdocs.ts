import admin from "../config/firebaseAdmin";
import dotenv from "dotenv";
dotenv.config();

const db = admin.firestore();

const schoolName = "Johnson Grammar School - Habsiguda";

async function countPublicTickets() {
  try {
    console.log("🔍 Counting public tickets...");

    const ticketsRef = db
      .collection("Tickets")
      .doc(schoolName)
      .collection(schoolName)
      .where("privacy", "==", true); // 👈 CONDITION ADDED

    const snapshot = await ticketsRef.count().get();

    const publicTicketCount = snapshot.data().count;

    console.log(
      `✅ Public Tickets (privacy == false) for ${schoolName}:`,
      publicTicketCount,
    );

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

countPublicTickets();
