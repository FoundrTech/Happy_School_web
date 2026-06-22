// functions/src/routes/ticketRoutes.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */
// eslint-disable-next-line new-cap
import {Router, Request, Response} from "express";
import {db} from "../config/firebase";
import {Timestamp} from "firebase-admin/firestore";
import {getAcademicYearRange} from "../utils/academicYear";
// eslint-disable-next-line new-cap
const router = Router();

// Helper function to convert string timestamp to Firestore Timestamp
const convertStringToTimestamp = (timestampValue: any): Timestamp | null => {
  try {
    if (!timestampValue) return null;

    // If it's already a Firestore Timestamp, return as is
    if (timestampValue instanceof Timestamp || (timestampValue._seconds && timestampValue._nanoseconds)) {
      return timestampValue;
    }

    // If it's a string, try to parse and convert to Timestamp
    if (typeof timestampValue === "string") {
      // Try parsing different date formats
      let date: Date;

      // Check if it's in DD/MM/YYYY, hh:mm A format
      if (timestampValue.includes(",") && timestampValue.includes("/")) {
        // Parse format like "17/09/2025, 02:30 PM"
        const [datePart, timePart] = timestampValue.split(", ");
        const [day, month, year] = datePart.split("/");
        const [time, ampm] = timePart.split(" ");
        const [hours, minutes] = time.split(":");

        let hour24 = parseInt(hours);
        if (ampm === "PM" && hour24 !== 12) hour24 += 12;
        if (ampm === "AM" && hour24 === 12) hour24 = 0;

        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hour24, parseInt(minutes));
      } else {
        // Try standard date parsing
        date = new Date(timestampValue);
      }

      if (isNaN(date.getTime())) {
        console.warn("Invalid date string:", timestampValue);
        return null;
      }

      return Timestamp.fromDate(date);
    }

    // If it's a number (Unix timestamp)
    if (typeof timestampValue === "number") {
      return Timestamp.fromMillis(timestampValue);
    }

    // Try to convert other formats
    const date = new Date(timestampValue);
    if (isNaN(date.getTime())) {
      return null;
    }

    return Timestamp.fromDate(date);
  } catch (error) {
    console.error("Error converting timestamp:", timestampValue, error);
    return null;
  }
};

// Helper function to get timestamp value for comparison
const getTimestampValue = (timestamp: any): number => {
  if (!timestamp) return 0;

  if (timestamp instanceof Timestamp) {
    return timestamp.toMillis();
  }

  if (timestamp._seconds) {
    return timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1000000;
  }

  if (typeof timestamp === "string") {
    const converted = convertStringToTimestamp(timestamp);
    return converted ? converted.toMillis() : 0;
  }

  if (typeof timestamp === "number") {
    return timestamp;
  }

  return new Date(timestamp).getTime() || 0;
};

router.get("/all-tickets/:email", async (req: Request, res: Response) => {
  const email: string = req.params.email;
  const {teacher, status, fromDate, toDate, category, academicYear} = req.query;

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
      res.status(404).json({error: "School not found"});
      return;
    }

    const ticketSubColRef = db
      .collection("Tickets")
      .doc(school)
      .collection(school).where("privacy", "==", false);

    // Fetch all tickets without ordering first (to handle mixed timestamp formats)
    const ticketsSnap = await ticketSubColRef.get();

    let tickets = ticketsSnap.docs.map((doc) => {
      const data = doc.data();

      // Convert string timestamps to Firestore Timestamps
      if (data.timestamp && typeof data.timestamp === "string") {
        const convertedTimestamp = convertStringToTimestamp(data.timestamp);
        if (convertedTimestamp) {
          data.timestamp = convertedTimestamp;
        }
      }

      return {
        id: doc.id,
        ...data,
      };
    });

    // Sort tickets by timestamp in descending order (newest first)
    tickets.sort((a, b) => {
      const timestampA = getTimestampValue((a as any).timestamp);
      const timestampB = getTimestampValue((b as any).timestamp);
      return timestampB - timestampA; // Descending order
    });

    // Apply filters after fetching and sorting
    if (teacher) {
      tickets = tickets.filter(
        (t) =>
          (t as any).email?.toLowerCase() === String(teacher).toLowerCase()
      );
    }

    if (status) {
      tickets = tickets.filter(
        (t) =>
          (t as any).status?.toLowerCase() === String(status).toLowerCase()
      );
    }

    if (category) {
      tickets = tickets.filter(
        (t) =>
          (t as any).category?.toLowerCase() ===
          String(category).toLowerCase()
      );
    }

    if (academicYear) {
      const range = getAcademicYearRange(String(academicYear));
      if (range) {
        tickets = tickets.filter((t) => {
          const time = getTimestampValue((t as any).timestamp);
          if (time === 0) return false;
          return time >= range.from.getTime() && time <= range.to.getTime();
        });
      }
    } else if (fromDate || toDate) {
      tickets = tickets.filter((t) => {
        const ticketTimestamp = (t as any).timestamp;
        const time = getTimestampValue(ticketTimestamp);

        if (time === 0) return false;

        const from = fromDate ?
          new Date(String(fromDate)).getTime() :
          -Infinity;
        const to = toDate ?
          new Date(String(toDate)).setHours(23, 59, 59, 999) :
          Infinity;

        return time >= from && time <= to;
      });
    }

    res.status(200).json({
      message: "Tickets fetched successfully",
      ticketCount: tickets.length,
      tickets,
    });
  } catch (e: any) {
    console.error("Error in TicketController:", e.message || e);

    // If the error is due to missing index, provide helpful information
    if (e.code === 9 || e.message?.includes("index")) {
      console.error("Firestore index required for timestamp ordering. Create a composite index for the collection with timestamp field.");
      res.status(500).json({
        error: "Database index required for sorting. Please contact administrator.",
        details: "Firestore composite index needed for timestamp ordering",
      });
      return;
    }

    res.status(500).json({error: "Internal server error"});
  }
});

// Add a route to get a single ticket by ID (useful for the ShowTicket component)


export default router;
