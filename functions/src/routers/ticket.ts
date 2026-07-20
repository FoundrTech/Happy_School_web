/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */
import express from "express";
import {ticket, editTicket, deleteTicket} from "../controllers/tickets";
// eslint-disable-next-line new-cap
const router = express.Router();

router.put("/edit", editTicket);
router.delete("/delete", deleteTicket);
// GET /tickets/:email
router.get("/:email", ticket);

export default router;
