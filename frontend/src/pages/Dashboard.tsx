/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { getCurrentAcademicYear } from "../utils/academicYear";
import AcademicYearFilter from "../components/AcademicYearFilter";

const { Title, Text } = Typography;

const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function Dashboard() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [summary, setSummary] = useState<{
    post: number;
    meetingTicketCount: number;
    earlyAdopterCount: number;
    taskscount?: number;
  } | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>(getCurrentAcademicYear());
  const cardStyle = { borderColor: "gray" };
  const dashboardRef = useRef<HTMLDivElement>(null);

  const donutData = summary
    ? [
        { name: "Posts", value: summary.post || 0, color: "#6366f1" },
        { name: "One on One Sessions", value: summary.meetingTicketCount, color: "#ffbb33" },
        { name: "Early Adopters", value: summary.earlyAdopterCount, color: "#ff0000ff" },
        { name: "Tasks", value: summary.taskscount || 0, color: "#f97316" },
      ]
    : [];

  useEffect(() => {
    const email = localStorage.getItem("email");
    if (!email) return;

    const params = { academicYear: selectedYear };

    axios
      .get(`https://api-rim6ljimuq-uc.a.run.app/sesson/all-tickets/${email}`, { params })
      .then((res) => setTickets(res.data.tickets || []))
      .catch((err) => console.error("Error fetching tickets:", err));

    axios
      .get(`https://api-rim6ljimuq-uc.a.run.app/dashboard/summary/${email}`, { params })
      .then((res) => {
        setSummary({
          post: res.data.postCount,
          meetingTicketCount: res.data.meetingTicketCount,
          earlyAdopterCount: res.data.earlyAdopterCount,
          taskscount: res.data.taskscount,
        });
      })
      .catch((err) => console.error("Error fetching dashboard summary:", err));
  }, [selectedYear]);

  const createdTickets = tickets.length;
  const solvedTickets = tickets.filter(
    (t) => t.status?.toLowerCase() === "resolved",
  ).length;
  const unsolvedTickets = createdTickets - solvedTickets;

  const getMonthFromTimestamp = (t: any): number | null => {
    try {
      if (!t.timestamp) return null;
      let parsed;
      if (typeof t.timestamp === "string") {
        parsed = dayjs(t.timestamp, "DD/MM/YYYY, hh:mm A");
      } else if (typeof t.timestamp.toDate === "function") {
        parsed = dayjs(t.timestamp.toDate());
      } else if (t.timestamp._seconds) {
        parsed = dayjs.unix(t.timestamp._seconds);
      } else if (t.timestamp.seconds) {
        parsed = dayjs.unix(t.timestamp.seconds);
      } else {
        parsed = dayjs(t.timestamp);
      }
      return parsed.isValid() ? parsed.month() : null;
    } catch {
      return null;
    }
  };

  // For bar chart: show months within the selected academic year (Jun–May)
  const [startYearStr] = selectedYear.split("-");
  const startYear = parseInt(startYearStr, 10);
  const academicMonths = [6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5]; // Jun→May

  const monthData = academicMonths.map((monthIdx) => {
    const year = monthIdx >= 6 ? startYear : startYear + 1;
    const monthTickets = tickets.filter((t) => {
      const m = getMonthFromTimestamp(t);
      if (m !== monthIdx) return false;
      // Check year too
      if (t.timestamp?._seconds) {
        return dayjs.unix(t.timestamp._seconds).year() === year;
      }
      return true;
    });
    const created = monthTickets.length;
    const solved = monthTickets.filter((t) => t.status?.toLowerCase() === "resolved").length;
    return created > 0 ? { name: months[monthIdx], Created: created, Solved: solved } : null;
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
          pdf.save(`dashboard-report-${selectedYear}.pdf`);
        };
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error("Error exporting PDF:", err);
    }
  };

  return (
    <div className="p-6" ref={dashboardRef}>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <Title level={2} style={{ margin: 0 }}>Dashboard</Title>
        <Button
          type="primary"
          onClick={handleExportPDF}
          style={{ backgroundColor: "#f97316", borderColor: "#f97316" }}
          className="hover:!bg-orange-600 hover:!border-orange-600"
        >
          Export Report
        </Button>
      </div>

      {/* Academic Year Filter */}
      <AcademicYearFilter
        selectedYear={selectedYear}
        onChange={setSelectedYear}
        className="mb-6"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card style={cardStyle}>
          <Text className="text-gray-500 font-bold !text-xl">Created Tickets</Text>
          <Title level={2}>{createdTickets?.toLocaleString()}</Title>
        </Card>

        <Card style={cardStyle}>
          <Text className="text-gray-500 font-bold !text-xl">Resolved Tickets</Text>
          <Title level={2}>{solvedTickets?.toLocaleString()}</Title>
          <Text type="success" style={{ fontSize: 16 }}>
            {createdTickets > 0 ? ((solvedTickets / createdTickets) * 100).toFixed(0) : 0}%
          </Text>
          <p className="text-gray-400 font-semibold">Tickets Have Been Resolved</p>
        </Card>

        <Card style={cardStyle}>
          <Text className="text-gray-500 font-bold !text-xl">Unresolved Tickets</Text>
          <Title level={2} className="text-red-500">{unsolvedTickets?.toLocaleString()}</Title>
          <Text type="danger">
            {createdTickets > 0 ? ((unsolvedTickets / createdTickets) * 100).toFixed(0) : 0}%
          </Text>
          <p className="text-gray-400 font-semibold">Tickets Have Not Been Resolved</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card style={cardStyle}>
          <Text className="text-gray-500 font-bold !text-xl">One On One Sessions</Text>
          <Title level={2}>{summary?.meetingTicketCount?.toLocaleString()}</Title>
          <p className="text-gray-400 font-semibold">Sessions Conducted</p>
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

      <Title level={4}>Tickets Overview — {selectedYear}</Title>
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
            Content Summary — {selectedYear}
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
