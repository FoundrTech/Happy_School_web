import express from "express";
import { getDashboardSummary } from "../controllers/DashboardController";

const router = express.Router();

router.get("/dashboard/:email", getDashboardSummary);
export default router;
