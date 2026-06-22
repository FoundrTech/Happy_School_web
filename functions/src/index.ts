/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */

import express from "express";
import {setGlobalOptions} from "firebase-functions/v2";
import {onRequest} from "firebase-functions/v2/https";
import cors from "cors";
import loginRoutes from "./routers/loginroute";
import {WEB_API_KEY, JWT_SECRET} from "./controllers/login"; // <- Import secrets
import dashboardroute from "./routers/dashboard";
import ticketroutes from "./routers/ticket";
import teacherroutes from "./routers/teacher";
import raiseticketroutes from "./routers/riseticket";
import alltickets from "./controllers/sessionTickets";
import challenge from "./controllers/challenges";
import task from "./controllers/task";
import taskans from "./controllers/taskAns";
import chart from "./controllers/chat";
import oneoneone from "./routers/oneonone";
import reports from "./routers/getLinks";
import schools from "./routers/counselorroutes/counselorschoolroute";
import counselordashboard from "./routers/counselorroutes/counselordashboardroute";
import couselortickets from "./routers/counselorroutes/counselorticketsroute";
import counselorteachers from "./routers/counselorroutes/counselorteachersroute";
import counselorchallenges from "./routers/counselorroutes/counselorchallengesroute";
import counseloroneonone from "./routers/counselorroutes/counseloroneononeroute";
import counseloraddticket from "./routers/counselorroutes/counseloraddticketroute";
import counseloraddticketteacher from "./routers/counselorroutes/counseloraddticketteachertoute";
import counseloraddticketwing from "./routers/counselorroutes/counseloraddticketwingroute";
import counselorreports from "./routers/counselorroutes/counselorreportsroute";
import coordinatordashboard from "./routers/Co-ordinator/Coordinatordashboard";
import Fetchtickets from "./routers/Co-ordinator/Fetchtickets";
import Fetchteacher from "./routers/Co-ordinator/Fetchteachers";
import passwordreset from "./controllers/passwordreset";
import createTeacher from "./controllers/createTeacher";
import {processBulkUpload} from "./controllers/bulkUploadTrigger";

setGlobalOptions({maxInstances: 10});

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "https://happyschool-99f85.web.app"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);
app.use(express.json());

app.use("/auth", loginRoutes);
app.use("/dashboard", dashboardroute);
app.use("/tickets", ticketroutes);
app.use("/teachers", teacherroutes);
app.use("/raiseticket", raiseticketroutes);
app.use("/sesson", alltickets);
app.use("/get", challenge);
app.use("/tasks", task);
app.use("/task-ans", taskans);
app.use("/chat", chart);
app.use("/oneonone", oneoneone);
app.use("/reports", reports);
app.use("/counselordashboard", counselordashboard);
app.use("/counselortickets", couselortickets);
app.use("/counselorteachers", counselorteachers);
app.use("/counselorchallenges", counselorchallenges);
app.use("/counseloroneonone", counseloroneonone);
app.use("/counseloraddticket", counseloraddticket);
app.use("/counseloraddticketteachers", counseloraddticketteacher);
app.use("/counseloraddticketwing", counseloraddticketwing);
app.use("/counselorreports", counselorreports);
app.use("/counselorschools", schools);

// Coordinator Routes
app.use("/co-ordinator/teachers", Fetchteacher);
app.use("/co-ordinator/tickets", Fetchtickets);
app.use("/co-ordinator", coordinatordashboard);
app.use("/auth", passwordreset);
app.use("/auth", createTeacher);

export const api = onRequest({secrets: [WEB_API_KEY, JWT_SECRET]}, app);
export const onBulkUpload = processBulkUpload;
