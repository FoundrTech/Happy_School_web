import express, { Router } from "express";
import {
  EditTicketController,
  DeleteTicketController,
} from "../controllers/TicketActionController";

const router: Router = express.Router();

router.put("/edit", EditTicketController);
router.delete("/delete", DeleteTicketController);

export default router;
