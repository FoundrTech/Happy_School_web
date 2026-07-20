import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import admin from "./config/firebaseAdmin";
import authRoutes from "./routes/LoginRoute";
import teacherRoutes from "./routes/TeacherRoute";
import ticketRoute from "./routes/TicketRoute";
import raiseTicketRoute from "./routes/RaiseTicketRoute";
import yourTicketRoute from "./routes/YourTicketRoute";
import ticketActionRoute from "./routes/TicketActionRoute";
import dashboard from "./routes/DashboardRoute";
import chat from "./routes/Chat";
import challenges from "./routes/ChallengeRoutes";
import tasks from "./routes/TaskRoutes";
import UserAnswerRoutes from "./routes/UserAnswers";
import OneOnOne from "./routes/OneOnOneRoutes";
import schools from "./routes/CounselorRoutes/CounselorSchoolRoute";
import counselorDashboard from "./routes/CounselorRoutes/CounselorDashboardRoute";
import couselorTickets from "./routes/CounselorRoutes/CounselorTicketsRoute";
import counselorTeachers from "./routes/CounselorRoutes/CounselorTeachersRoute";
import counselorChallenges from "./routes/CounselorRoutes/CounselorChallengesRoute";
import counselorOneOnOne from "./routes/CounselorRoutes/CounselorOneOnOneRoute";
import counselorAddTicket from "./routes/CounselorRoutes/CounselorAddTicketRoute";
import counselorAddTicketTeacher from "./routes/CounselorRoutes/CounselorAddTicketTeacherRoute";
import counselorAddTicketWing from "./routes/CounselorRoutes/CounselorAddTicketWingRoute";
import counselorReports from "./routes/CounselorRoutes/CounselorReportsRoute";
import links from "./routes/GetReports";
import Fetchteacher from "./routes/Coordinator/FetchTeacher";
import FetchTickets from "./routes/Coordinator/FetchTickets";
import coordinatordashboard from "./routes/Coordinator/CoordinatorDashboard";
import passwordrest from "./controllers/passwordreset";

const app = express();
const db = admin.firestore();

app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: "GET,POST,PUT,DELETE,PATCH",
    allowedHeaders: "Content-Type,Authorization,x-api-key",
  })
);

app.use("/auth", authRoutes);
app.use("/get", teacherRoutes);
app.use("/getTickets", ticketRoute);
app.use("/postTicket", raiseTicketRoute);
app.use("/user", yourTicketRoute);
app.use("/tickets", ticketActionRoute);
app.use("/api", dashboard);
app.use("/chat", chat);
app.use("/challenges", challenges);
app.use("/tasks", tasks);
app.use("/answers", UserAnswerRoutes);
app.use("/oneonone", OneOnOne);
app.use("/reports", links);
// Counselor Routes
app.use("/counselordashboard", counselorDashboard);
app.use("/counselortickets", couselorTickets);
app.use("/counselorteachers", counselorTeachers);
app.use("/counselorchallenges", counselorChallenges);
app.use("/counseloroneonone", counselorOneOnOne);
app.use("/counseloraddticket", counselorAddTicket);
app.use("/counseloraddticketteachers", counselorAddTicketTeacher);
app.use("/counseloraddticketwing", counselorAddTicketWing);
app.use("/counselorreports", counselorReports);
app.use("/counselorschools", schools);
// Coordinator Routes
app.use("/co-ordinator/teachers", Fetchteacher);
app.use("/co-ordinator/tickets", FetchTickets);
app.use("/co-ordinator", coordinatordashboard);
app.use("/auth", passwordrest);

app.get("/", async (req: Request, res: Response) => {
  try {
    const snapshot = await db
      .collection("Users")
      .doc("thannirurajabrahmam@gmail.com")
      .collection("userinfo")
      .doc("userinfo")
      .get();

    if (snapshot.exists) {
      const data = snapshot.data();
      const userName = data?.Name;
      res.send({ name: userName });
    } else {
      res.status(404).send({ error: "User not found" });
    }
  } catch (err) {
    console.error("Error fetching user data:", err);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
