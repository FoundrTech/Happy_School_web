/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// Updated Dashboard.tsx to handle both string and Firestore Timestamp formats

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Button, Card, Typography } from "antd";
import jsPDF from "jspdf";
import dayjs from "dayjs";
import domtoimage from "dom-to-image";

const { Title, Text } = Typography;

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function Dashboard() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [summary, setSummary] = useState<{
    post: number;
    meetingTicketCount: number;
    earlyAdopterCount: number;
    taskscount?: number;
  } | null>(null);
  const cardStyle = { borderColor: "gray" };
  const dashboardRef = useRef<HTMLDivElement>(null);
  const donutData = summary
    ? [
        { name: "Posts", value: summary.post || 0, color: "#6366f1" }, // Indigo // Green// Orange
        {
          name: "One on One Sessions",
          value: summary.meetingTicketCount,
          color: "#ffbb33",
        }, // Yellow
        {
          name: "Early Adopters",
          value: summary.earlyAdopterCount,
          color: "#ff0000ff",
        },
        { name: "Tasks", value: summary.taskscount || 0, color: "#f97316" }, // Green
      ]
    : [];

  useEffect(() => {
    const email = localStorage.getItem("email");
    if (!email) return;

    axios
      .get(`https://api-rim6ljimuq-uc.a.run.app/sesson/all-tickets/${email}`)
      .then((res) => {
        console.log("Fetched tickets:", res.data.tickets);
        setTickets(res.data.tickets || []);
      })
      .catch((err) => console.error("Error fetching tickets:", err));
  }, []);
  useEffect(() => {
    const email = localStorage.getItem("email");
    if (!email) return;
    //https://api-rim6ljimuq-uc.a.run.app/dashboard/summary/${email}
    axios
      .get(`https://api-rim6ljimuq-uc.a.run.app/dashboard/summary/${email}`)
      .then((res) => {
        const { postCount, challengeCount } = res.data;
        setSummary({
          post: postCount,
          meetingTicketCount: res.data.meetingTicketCount,
          earlyAdopterCount: res.data.earlyAdopterCount,
          taskscount: res.data.taskscount,
        });
      })
      .catch((err) => {
        console.error("Error fetching dashboard summary:", err);
      });
  }, []);

  const createdTickets = tickets.length;
  const solvedTickets = tickets.filter(
    (t) => t.status?.toLowerCase() === "resolved",
  ).length;
  const unsolvedTickets = createdTickets - solvedTickets;

  const currentMonthIndex = new Date().getMonth();

  const getMonthFromTimestamp = (t: any): number | null => {
    try {
      if (!t.timestamp) return null;

      let parsed;

      if (typeof t.timestamp === "string") {
        // Parse string date (requires customParseFormat plugin if not ISO)
        parsed = dayjs(t.timestamp, "DD/MM/YYYY, hh:mm A");
      } else if (typeof t.timestamp.toDate === "function") {
        // Firestore Timestamp object
        parsed = dayjs(t.timestamp.toDate());
      } else if (t.timestamp._seconds) {
        // Firestore serialized timestamp
        parsed = dayjs.unix(t.timestamp._seconds);
      } else if (t.timestamp.seconds) {
        // In case it comes with `seconds` (some APIs do this)
        parsed = dayjs.unix(t.timestamp.seconds);
      } else {
        parsed = dayjs(t.timestamp);
      }

      return parsed.isValid() ? parsed.month() : null;
    } catch (err) {
      console.error("Invalid timestamp format:", t.timestamp, err);
      return null;
    }
  };

  const monthData = Array.from({ length: currentMonthIndex + 1 }, (_, i) => {
    const monthName = months[i];

    const created = tickets.filter(
      (t) => getMonthFromTimestamp(t) === i,
    ).length;

    const solved = tickets.filter(
      (t) =>
        getMonthFromTimestamp(t) === i &&
        t.status?.toLowerCase() === "resolved",
    ).length;

    return created > 0
      ? { name: monthName, Created: created, Solved: solved }
      : null;
  }).filter(Boolean);

  const handleExportPDF = async () => {
    if (!dashboardRef.current) return;

    try {
      const blob = await domtoimage.toBlob(dashboardRef.current);
      const reader = new FileReader();

      reader.onloadend = () => {
        const pdf = new jsPDF("p", "mm", "a4");
        const img = new Image();
        img.src = reader.result as string;

        img.onload = () => {
          const width = pdf.internal.pageSize.getWidth();
          const height = (img.height * width) / img.width;
          pdf.addImage(img, "PNG", 0, 0, width, height);
          pdf.save("dashboard-report.pdf");
        };
      };

      reader.readAsDataURL(blob);
    } catch (err) {
      console.error("Error exporting PDF:", err);
    }
  };

  const handleRedirect = () => {
    // Replace with your desired URL
    window.open("https://example.com", "_blank");
  };

  return (
    <div className="p-6" ref={dashboardRef}>
      <div className="flex justify-between items-center mb-4">
        <Title level={2}>Dashboard</Title>
        <div className="flex flex-col gap-2">
          <Button
            type="primary"
            onClick={handleExportPDF}
            style={{ backgroundColor: "#f97316", borderColor: "#f97316" }}
            className="hover:!bg-orange-600 hover:!border-orange-600"
          >
            Export Report
          </Button>
          {/* <Button
            type="default"
            onClick={handleRedirect}
            className="border-orange-500 text-orange-500 hover:!border-orange-600 hover:!text-orange-600"
          >
            View Details
          </Button> */}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card style={cardStyle}>
          <Text className="text-gray-500 font-bold !text-xl">
            Created Tickets
          </Text>
          <Title level={2}>{createdTickets?.toLocaleString()}</Title>
        </Card>

        <Card style={cardStyle}>
          <Text className="text-gray-500 font-bold !text-xl">
            Resolved Tickets
          </Text>
          <Title level={2}>{solvedTickets?.toLocaleString()}</Title>
          <Text type="success" style={{ fontSize: 16 }}>
            {((solvedTickets / createdTickets) * 100).toFixed(0)}%
          </Text>
          <p className="text-gray-400 font-semibold">
            Tickets Have Been Resolved
          </p>
        </Card>

        <Card style={cardStyle}>
          <Text className="text-gray-500 font-bold !text-xl">
            Unresolved Tickets
          </Text>
          <Title level={2} className="text-red-500">
            {unsolvedTickets?.toLocaleString()}
          </Title>
          <Text type="danger">
            {((unsolvedTickets / createdTickets) * 100).toFixed(0)}%
          </Text>
          <p className="text-gray-400 font-semibold">
            Tickets Have Not Been Resolved
          </p>
        </Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card style={cardStyle}>
          <Text className="text-gray-500 font-bold !text-xl">
            One On One Sessions
          </Text>
          <Title level={2}>
            {summary?.meetingTicketCount?.toLocaleString()}
          </Title>
          <p className="text-gray-400 font-semibold">
            One On One Sessions Have Been Conducted
          </p>
        </Card>

        <Card style={cardStyle}>
          <Text className="text-gray-500 font-bold !text-xl">Tasks</Text>
          <Title level={2}>{summary?.taskscount?.toLocaleString()}</Title>
          <p className="text-gray-400 font-semibold">Tasks Have Been Created</p>
        </Card>

        <Card style={cardStyle}>
          <Text className="text-gray-500 font-bold !text-xl">Posts</Text>
          <Title level={2}>{summary?.post?.toLocaleString()}</Title>
          <p className="text-gray-400 font-semibold">Posts Have Been Created</p>
        </Card>
      </div>
      <Title level={4}>Tickets Overview (Month-wise)</Title>
      <center>
        <ResponsiveContainer width="50%" height={300}>
          <BarChart data={monthData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Created" stackId="a" fill="#c4b5fd" name="CREATE" />
            <Bar dataKey="Solved" stackId="a" fill="#7c3aed" name="SOLVED" />
          </BarChart>
        </ResponsiveContainer>
      </center>
      {summary && (
        <>
          <Title level={4} className="mt-10">
            Content Summary
          </Title>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={donutData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                label
                labelLine={false}
              >
                {donutData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  marginTop: 20,
                  rowGap: 10,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}

export default Dashboard;
