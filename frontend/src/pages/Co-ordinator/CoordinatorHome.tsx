/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Button, Card, Typography } from "antd";
import jsPDF from "jspdf";
import domtoimage from "dom-to-image";
import { getAcademicYears, getCurrentAcademicYear } from "../../utils/academicYear";
import AcademicYearFilter from "../../components/AcademicYearFilter";

const { Title, Text } = Typography;

const CoordinatorHome: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>(getCurrentAcademicYear());
  const dashboardRef = useRef<HTMLDivElement>(null);

  const cardStyle = { borderColor: "gray" };
  const wingId = localStorage.getItem("wingId");

  const donutData = summary
    ? [
        { name: "Teachers", value: summary.totalTeachers || 0, color: "#6366f1" },
        { name: "Tickets", value: summary.totalTickets || 0, color: "#f97316" },
        { name: "Sessions", value: summary.totalSessions || 0, color: "#22c55e" },
        { name: "Tasks", value: summary.taskCount || 0, color: "#ef4444" },
        { name: "Posts", value: summary.postCount || 0, color: "#eab308" },
        { name: "Early Adopters", value: summary.earlyAdopterCount || 0, color: "#3b82f6" },
      ]
    : [];

  useEffect(() => {
    if (!wingId) return;
    setLoading(true);

    const params: Record<string, string> = {};
    if (selectedYear) params.academicYear = selectedYear;

    axios
      .get(`https://api-rim6ljimuq-uc.a.run.app/co-ordinator/summary/${wingId}`, { params })
      .then((res) => {
        setSummary(res.data.stats);
      })
      .catch((err) => {
        console.error("Error fetching coordinator summary:", err);
      })
      .finally(() => setLoading(false));
  }, [wingId, selectedYear]);

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
          pdf.save(`coordinator-dashboard-${selectedYear}.pdf`);
        };
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error("Error exporting PDF:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-lg">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="p-6" ref={dashboardRef}>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <Title level={2} style={{ margin: 0 }}>Coordinator Dashboard</Title>
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

      {/* Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card style={cardStyle}>
          <Text className="text-gray-500 font-bold !text-xl">Total Teachers</Text>
          <Title level={2}>{summary?.totalTeachers ?? 0}</Title>
        </Card>

        <Card style={cardStyle}>
          <Text className="text-gray-500 font-bold !text-xl">Total Tickets</Text>
          <Title level={2}>{summary?.totalTickets ?? 0}</Title>
        </Card>

        <Card style={cardStyle}>
          <Text className="text-gray-500 font-bold !text-xl">Total Sessions</Text>
          <Title level={2}>{summary?.totalSessions ?? 0}</Title>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card style={cardStyle}>
          <Text className="text-gray-500 font-bold !text-xl">Tasks</Text>
          <Title level={2}>{summary?.taskCount ?? 0}</Title>
        </Card>

        <Card style={cardStyle}>
          <Text className="text-gray-500 font-bold !text-xl">Posts</Text>
          <Title level={2}>{summary?.postCount ?? 0}</Title>
        </Card>

        <Card style={cardStyle}>
          <Text className="text-gray-500 font-bold !text-xl">Early Adopters</Text>
          <Title level={2}>{summary?.earlyAdopterCount ?? 0}</Title>
        </Card>
      </div>

      {/* Donut Chart Section */}
      <Title level={4}>Coordinator Summary Overview — {selectedYear}</Title>
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={donutData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={120}
            label
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
    </div>
  );
};

export default CoordinatorHome;
