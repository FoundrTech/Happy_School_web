import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import * as XLSX from "xlsx";
import { getCurrentAcademicYear } from "../../utils/academicYear";
import AcademicYearFilter from "../../components/AcademicYearFilter";

interface Teacher {
  Name: string;
  email: string;
  coins?: number;
  role?: string;
}

const COLORS = ["#22c55e", "#ef4444"];

const CoordinatorUnanswered = () => {
  const { challengeId, taskName } = useParams<{
    challengeId: string;
    taskName: string;
  }>();
  const [searchParams] = useSearchParams();

  const decodedTaskName = decodeURIComponent(taskName || "");
  const [answeredTeachers, setAnsweredTeachers] = useState<Teacher[]>([]);
  const [unansweredTeachers, setUnansweredTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>(
    searchParams.get("academicYear") || getCurrentAcademicYear()
  );
  const wingId = localStorage.getItem("wingId");

  useEffect(() => {
    const email = localStorage.getItem("email");
    if (!email || !challengeId || !decodedTaskName) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const teacherRes = await axios.get(
          `https://api-rim6ljimuq-uc.a.run.app/co-ordinator/teachers/${wingId}`
        );

        const allTeachers: Teacher[] = teacherRes.data.teachers || [];

        // Filter out coordinators
        const filteredTeachers = allTeachers.filter(
          (teacher) => teacher.role?.toLowerCase() !== "co-ordinator"
        );

        const docRes = await axios.get(
          `https://api-rim6ljimuq-uc.a.run.app/task-ans/${challengeId}/${encodeURIComponent(
            decodedTaskName
          )}`
        );

        const answeredEmails: string[] = docRes.data.documentNames || [];

        const answered: Teacher[] = [];
        const unanswered: Teacher[] = [];

        filteredTeachers.forEach((teacher) => {
          const teacherEmail = teacher.email?.trim()?.toLowerCase();
          if (answeredEmails.includes(teacherEmail)) {
            answered.push(teacher);
          } else {
            unanswered.push(teacher);
          }
        });

        setAnsweredTeachers(answered.sort((a, b) => (b.coins ?? 0) - (a.coins ?? 0)));
        setUnansweredTeachers(unanswered.sort((a, b) => (b.coins ?? 0) - (a.coins ?? 0)));
      } catch (err) {
        console.error("Error:", err);
        setError("Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [challengeId, decodedTaskName, wingId, selectedYear]);

  const handleDownloadExcel = () => {
    if (answeredTeachers.length === 0 && unansweredTeachers.length === 0) {
      alert("No data available to download yet!");
      return;
    }

    const answeredData = [
      ["Name", "Email", "Coins"],
      ...answeredTeachers.map((t) => [t.Name || "-", t.email || "-", t.coins ?? "-"]),
    ];

    const unansweredData = [
      ["Name", "Email", "Coins"],
      ...unansweredTeachers.map((t) => [t.Name || "-", t.email || "-", t.coins ?? "-"]),
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet(answeredData),
      "Answered Teachers"
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet(unansweredData),
      "Unanswered Teachers"
    );

    XLSX.writeFile(
      workbook,
      `Task_Report_${decodedTaskName || "Report"}_${selectedYear}.xlsx`,
      { bookType: "xlsx", type: "binary" }
    );
  };

  const renderTeacherList = (teachers: Teacher[]) => (
    <ul className="space-y-3">
      {teachers.map((teacher, index) => (
        <li
          key={index}
          className="bg-gray-100 hover:bg-gray-200 transition p-3 rounded-md text-gray-800 shadow-sm"
        >
          <div className="font-semibold">{teacher.Name}</div>
          <div className="text-sm text-gray-600">{teacher.email}</div>
          {teacher.coins !== undefined && (
            <div className="text-xs text-gray-500">Coins: {teacher.coins}</div>
          )}
        </li>
      ))}
    </ul>
  );

  const chartData = [
    { name: "Complete", value: answeredTeachers.length },
    { name: "Incomplete", value: unansweredTeachers.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">
        Task: {decodedTaskName}
      </h2>

      {/* Academic Year Filter */}
      <div className="flex justify-center mb-6">
        <AcademicYearFilter
          selectedYear={selectedYear}
          onChange={setSelectedYear}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="text-gray-600">Loading...</div>
        </div>
      ) : error ? (
        <p className="text-red-600 text-center">{error}</p>
      ) : (
        <>
          {/* Pie Chart Section */}
          <div className="bg-white p-6 rounded-xl shadow-lg mb-8 max-w-xl mx-auto">
            <h3 className="text-xl font-semibold text-center mb-1">
              Completion Overview
            </h3>
            <p className="text-center text-sm text-gray-500 mb-4">{selectedYear}</p>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) =>
                    `${name}: ${(
                      ((value ?? 0) /
                        (answeredTeachers.length + unansweredTeachers.length || 1)) *
                      100
                    ).toFixed(1)}%`
                  }
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-end mb-6">
            <button
              onClick={handleDownloadExcel}
              disabled={
                loading ||
                (answeredTeachers.length === 0 && unansweredTeachers.length === 0)
              }
              className={`px-4 py-2 rounded-lg shadow-md transition text-white ${
                loading ||
                (answeredTeachers.length === 0 && unansweredTeachers.length === 0)
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              Download Report
            </button>
          </div>

          {/* Answered and Unanswered Lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col">
              <h3 className="text-xl font-semibold text-green-700 mb-4 border-b pb-2">
                Teachers Who Completed The Task ({answeredTeachers.length})
              </h3>
              <div className="flex-1 overflow-y-auto max-h-96 pr-2">
                {answeredTeachers.length > 0 ? (
                  renderTeacherList(answeredTeachers)
                ) : (
                  <p className="text-gray-500 italic">
                    No teachers have answered yet.
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col">
              <h3 className="text-xl font-semibold text-red-700 mb-4 border-b pb-2">
                Teachers Who Did Not Complete The Task ({unansweredTeachers.length})
              </h3>
              <div className="flex-1 overflow-y-auto max-h-96 pr-2">
                {unansweredTeachers.length > 0 ? (
                  renderTeacherList(unansweredTeachers)
                ) : (
                  <p className="text-gray-500 italic">All teachers have answered.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CoordinatorUnanswered;
