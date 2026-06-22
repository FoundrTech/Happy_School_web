// functions/src/routers/teacherRoute.ts

/* eslint-disable @typescript-eslint/no-explicit-any */


/* eslint-disable max-len */

import express from "express";
import {teacher, bulkCreate, deleteTeacher} from "../controllers/teacher";
import admin from "../config/firebase";
// eslint-disable-next-line new-cap
const router = express.Router();

// GET /teachers/schools — all school names for the bulk-upload dropdown
router.get("/schools", async (_req, res) => {
  try {
    const snap = await admin.firestore().collection("Schools").get();
    const schools = snap.docs.map((d) => d.data().SchoolName as string).filter(Boolean).sort();
    res.status(200).json({schools});
  } catch (e: any) {
    res.status(500).json({error: e.message});
  }
});

// GET /teachers/:email
router.get("/:email", teacher);

// POST /teachers/bulk-create
router.post("/bulk-create", bulkCreate);

// DELETE /teachers/:email
router.delete("/:email", deleteTeacher);

export default router;
