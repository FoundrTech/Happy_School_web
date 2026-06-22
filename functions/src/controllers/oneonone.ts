/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */

import {Request, Response} from "express";
import {db} from "../config/firebase";
import {filterByAcademicYear, timestampToMs} from "../utils/academicYear";

interface FirestoreTimestamp {
  _seconds: number;
  _nanoseconds: number;
}

interface Contributor {
  name: string;
  email: string;
}

interface TeacherObject {
  name: string;
  email: string;
}

interface Ticket {
  id: string;
  oneononesessions: number;
  tocken: number;
  uid?: string;
  ticketText: string;
  school: string;
  userName: string;
  email: string;
  timestamp: FirestoreTimestamp;
  status: string;
  contributors?: Contributor[];
  category?: string;
  teacher?: TeacherObject | string;
  reply?: string;
  meetinglink?: string;
  [key: string]: unknown;
}

interface UserData {
  school?: string;
  [key: string]: unknown;
}

export const oneononecontroller = async (
  req: Request,
  res: Response
): Promise<void> => {
  const email: string = req.params.email;
  const {teacher, status, fromDate, toDate, category, academicYear} = req.query;

  try {
    // 1) Get the requesting user's school
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

    const userData = userInfoSnap.data() as UserData;
    const school = userData?.school;

    if (!school) {
      res.status(404).json({error: "School not found"});
      return;
    }

    // 2) Get the tickets
    const ticketSubColRef = db
      .collection("Tickets")
      .doc(school)
      .collection(school);
    const ticketsSnap = await ticketSubColRef.get();

    let tickets: Ticket[] = ticketsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Ticket[];

    // Only tickets with oneononesessions > 0
    tickets = tickets.filter(
      (t) => t.oneononesessions && t.oneononesessions > 0
    );

    // 3) Academic year filter (takes precedence over manual fromDate/toDate)
    if (academicYear) {
      tickets = filterByAcademicYear(
        tickets,
        String(academicYear),
        (t) => t.timestamp
      ) as Ticket[];
    } else if (fromDate || toDate) {
      const from = fromDate ? new Date(String(fromDate)).getTime() : -Infinity;
      const to = toDate ? new Date(String(toDate)).getTime() : Infinity;

      tickets = tickets.filter((t) => {
        if (!t.timestamp) return false;
        const ms = timestampToMs(t.timestamp);
        if (ms === null) return false;
        return ms >= from && ms <= to;
      });
    }

    // 4) Other filters
    if (teacher) {
      tickets = tickets.filter((t) => {
        if (typeof t.teacher === "string") {
          return t.teacher.toLowerCase() === String(teacher).toLowerCase();
        } else if (t.teacher && typeof t.teacher === "object" && "email" in t.teacher) {
          const teacherObj = t.teacher as TeacherObject;
          return teacherObj.email?.toLowerCase() === String(teacher).toLowerCase();
        }
        return t.email?.toLowerCase() === String(teacher).toLowerCase();
      });
    }

    if (status) {
      tickets = tickets.filter(
        (t) => t.status?.toLowerCase() === String(status).toLowerCase()
      );
    }

    if (category) {
      tickets = tickets.filter(
        (t) => t.category?.toLowerCase() === String(category).toLowerCase()
      );
    }

    res.status(200).json({
      message: "Tickets with oneononesessions > 0 fetched successfully",
      academicYear: academicYear || "all",
      ticketCount: tickets.length,
      tickets,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in OneOnOneTicketController:", errorMessage);
    res.status(500).json({error: "Internal server error"});
  }
};
