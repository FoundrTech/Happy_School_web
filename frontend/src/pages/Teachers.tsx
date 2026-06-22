import { useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  Input,
  Typography,
  Avatar,
  Spin,
  Badge,
  Tooltip,
  Tag,
  Button,
} from "antd";
import {
  UserOutlined,
  SearchOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";
import { getCurrentAcademicYear } from "../utils/academicYear";
import AcademicYearFilter from "../components/AcademicYearFilter";

const { Title } = Typography;

interface Teacher {
  id?: string;
  Name?: string;
  email?: string;
  phone?: string;
  role?: string;
  coins?: number;
  profileImage?: string;
}

const rankColors = ["#FFD700", "#C0C0C0", "#CD7F32"];

function Teachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedYear, setSelectedYear] = useState<string>(getCurrentAcademicYear());
  const pageSize = 8;

  useEffect(() => {
    const email = localStorage.getItem("email");
    if (!email) return;

    axios
      .get(`https://api-rim6ljimuq-uc.a.run.app/teachers/${email}`, {
        params: { academicYear: selectedYear },
      })
      .then((res) => {
        const fetched = res.data.teachers || [];
        const sorted = fetched.sort(
          (a: Teacher, b: Teacher) => (b.coins ?? 0) - (a.coins ?? 0)
        );
        setTeachers(sorted);
      })
      .catch((err) => console.error("Error fetching teachers:", err))
      .finally(() => setLoading(false));
  }, [selectedYear]);

  const filtered = teachers.filter((t) => {
    const term = searchTerm.toLowerCase();
    return (
      t.Name?.toLowerCase().includes(term) ||
      t.email?.toLowerCase().includes(term)
    );
  });

  const handleDownload = () => {
    const dataToExport = filtered
      .filter((t) => t.role?.toLowerCase() !== "principal")
      .map((t, idx) => ({
        Rank: idx + 1,
        Name: t.Name || "-",
        Email: t.email || "-",
        Phone: t.phone || "-",
        Role: t.role || "-",
        Coins: t.coins ?? 0,
      }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Teachers");

    XLSX.writeFile(workbook, "teachers_list.xlsx");
  };

  const columns = [
    {
      title: "Rank",
      key: "rank",
      width: 80,
      render: (_: unknown, __: Teacher, index: number) => {
        const absoluteIndex = (currentPage - 1) * pageSize + index;
        return (
          <Tooltip title={`Rank ${absoluteIndex + 1}`}>
            <Badge
              count={absoluteIndex + 1}
              style={{
                backgroundColor: rankColors[absoluteIndex] || "#722ed1",
                color: "#fff",
                fontWeight: "bold",
                boxShadow: "0 0 6px rgba(0,0,0,0.1)",
              }}
            />
          </Tooltip>
        );
      },
    },
    {
      title: "Name",
      dataIndex: "Name",
      key: "Name",
      render: (_: unknown, record: Teacher) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={record.profileImage}
            icon={<UserOutlined />}
            size="large"
            style={{ backgroundColor: "#f0f0f0" }}
          />
          <span className="font-semibold text-gray-800 text-sm sm:text-base">
            {record.Name || "-"}
          </span>
        </div>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (text: string) =>
        text ? (
          <span className="text-gray-700 text-xs sm:text-sm break-all">
            {text}
          </span>
        ) : (
          <div className="text-center text-gray-400 font-medium">-</div>
        ),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      render: (text: string) =>
        text ? (
          <span className="text-gray-600 text-xs sm:text-sm">{text}</span>
        ) : (
          <div className="text-center text-gray-400 font-medium">-</div>
        ),
    },
    {
      title: "Designation",
      dataIndex: "role",
      key: "role",
      render: (text: string) =>
        text ? (
          <Tag color="geekblue" className="capitalize font-medium text-xs">
            {text}
          </Tag>
        ) : (
          <div className="text-center text-gray-400 font-medium">-</div>
        ),
    },
    {
      title: "Coins",
      dataIndex: "coins",
      key: "coins",
      render: (coins: number) => (
        <span className="font-semibold text-green-600 text-sm sm:text-base">
          {coins ?? "0"}
        </span>
      ),
    },
  ];

  // Mobile Card Component
  const TeacherCard = ({
    teacher,
    index,
  }: {
    teacher: Teacher;
    index: number;
  }) => {
    const absoluteIndex = (currentPage - 1) * pageSize + index;
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200">
        <div className="flex items-start gap-4 mb-3">
          <div className="relative">
            <Avatar
              src={teacher.profileImage}
              icon={<UserOutlined />}
              size={64}
              style={{ backgroundColor: "#f0f0f0" }}
            />
            <Badge
              count={absoluteIndex + 1}
              style={{
                backgroundColor: rankColors[absoluteIndex] || "#722ed1",
                color: "#fff",
                fontWeight: "bold",
                position: "absolute",
                top: -8,
                right: -8,
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-800 text-lg mb-1 break-words">
              {teacher.Name || "-"}
            </h3>
            {teacher.role && (
              <Tag
                color="geekblue"
                className="capitalize font-medium text-xs mb-2"
              >
                {teacher.role}
              </Tag>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">Coins</div>
            <span className="font-bold text-green-600 text-xl">
              {teacher.coins ?? "0"}
            </span>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-start">
            <span className="text-gray-500 w-16 flex-shrink-0">Email:</span>
            <span className="text-gray-700 break-all">
              {teacher.email || "-"}
            </span>
          </div>
          <div className="flex items-start">
            <span className="text-gray-500 w-16 flex-shrink-0">Phone:</span>
            <span className="text-gray-700">{teacher.phone || "-"}</span>
          </div>
        </div>
      </div>
    );
  };

  const filteredTeachers = filtered.filter(
    (t) => t.role?.toLowerCase() !== "principal"
  );

  // Pagination for mobile cards
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTeachers = filteredTeachers.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <Title className="text-orange-600 m-0 text-xl sm:text-2xl">
          Teachers{" "}
          <span className="text-gray-500 text-base sm:text-lg">
            ({teachers.length})
          </span>
        </Title>

        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleDownload}
          className="w-full sm:w-auto"
          size="large"
        >
          Download List
        </Button>
      </div>

      {/* Academic Year Filter */}
      <AcademicYearFilter
        selectedYear={selectedYear}
        onChange={setSelectedYear}
        className="mb-4"
      />

      {/* Search */}
      <Input
        placeholder="Search by name or email..."
        prefix={<SearchOutlined />}
        className="mb-4 sm:mb-6 bg-white shadow-sm rounded-lg"
        size="large"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        allowClear
      />

      {loading ? (
        <div className="flex justify-center items-center h-60">
          <Spin size="large" tip="Loading teachers..." />
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <Table
              dataSource={filteredTeachers}
              columns={columns}
              rowKey={(record) =>
                record.email || record.id || Math.random().toString()
              }
              pagination={{
                pageSize,
                current: currentPage,
                onChange: (page) => setCurrentPage(page),
              }}
              bordered
              className="rounded-lg bg-white shadow-md overflow-hidden"
            />
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden">
            {filteredTeachers.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                No teachers found
              </div>
            ) : (
              <>
                {paginatedTeachers.map((teacher, index) => (
                  <TeacherCard
                    key={teacher.email || teacher.id || index}
                    teacher={teacher}
                    index={index}
                  />
                ))}

                {/* Mobile Pagination */}
                {filteredTeachers.length > pageSize && (
                  <div className="flex justify-center items-center gap-4 mt-6">
                    <Button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      size="large"
                    >
                      Previous
                    </Button>
                    <span className="text-gray-600">
                      Page {currentPage} of{" "}
                      {Math.ceil(filteredTeachers.length / pageSize)}
                    </span>
                    <Button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={
                        currentPage >=
                        Math.ceil(filteredTeachers.length / pageSize)
                      }
                      size="large"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Teachers;
