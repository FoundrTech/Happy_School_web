import { useEffect, useState } from "react";
import axios from "axios";
import { Table, Tag, Typography, Spin, Space, Select, Tooltip } from "antd";
import { useNavigate } from "react-router-dom";
import { FilterOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { getCurrentAcademicYear } from "../utils/academicYear";
import AcademicYearFilter from "../components/AcademicYearFilter";
dayjs.extend(customParseFormat);
const { Title } = Typography;

type Contributor = {
  name: string;
  email: string;
};

type Ticket = {
  id: string;
  ticketText: string;
  status?: string;
  tocken?: number;
  timestamp?: string;
  contributors?: Contributor[];
  userName?: string;
  email?: string;
  category?: string;
  oneononesessions?: string;
};

interface Teacher {
  id?: string;
  Name?: string;
  email?: string;
  phone?: string;
  role?: string;
  coins?: number;
  profileImage?: string;
}

function OneOnOneSessions() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const navigate = useNavigate();
  const email = localStorage.getItem("email");
  const [showFilters, setShowFilters] = useState(false);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedTeacherEmail, setSelectedTeacherEmail] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>(getCurrentAcademicYear());

  const renderTicketSubject = (text: string) => {
    if (text && text.length > 20) {
      return (
        <Tooltip
          title={text}
          overlayStyle={{
            backgroundColor: "#ea580c",
            color: "white",
            fontSize: "14px",
            borderRadius: "8px",
            padding: "8px 12px",
            maxWidth: 400,
          }}
          overlayInnerStyle={{
            backgroundColor: "#ea580c",
            color: "white",
          }}
        >
          <span className="font-semibold text-indigo-600 text-sm sm:text-base cursor-pointer">
            {text.substring(0, 30)}...
          </span>
        </Tooltip>
      );
    }
    return (
      <span className="font-semibold text-indigo-600 text-sm sm:text-base">
        {text}
      </span>
    );
  };

  const toggleFilters = () => setShowFilters((prev) => !prev);

  useEffect(() => {
    if (!email) return;

    const fetchFilteredTickets = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (selectedStatus) params.status = selectedStatus;
        if (selectedTeacherEmail) params.teacher = selectedTeacherEmail;
        if (selectedCategory) params.category = selectedCategory;
        if (selectedYear) params.academicYear = selectedYear;

        const response = await axios.get(
          `https://api-rim6ljimuq-uc.a.run.app/oneonone/${email}`,
          { params }
        );

        const fetched = response.data.tickets || [];
        console.log("Fetched tickets:", fetched);
        const sorted = fetched.sort(
          (a: Ticket, b: Ticket) =>
            new Date(b.timestamp ?? "").getTime() -
            new Date(a.timestamp ?? "").getTime()
        );
        setTickets(sorted);
      } catch (err) {
        console.error("Error fetching teachers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredTickets();
  }, [
    email,
    selectedStatus,
    selectedTeacher,
    fromDate,
    toDate,
    selectedCategory,
    selectedTeacherEmail,
    selectedYear,
  ]);

  useEffect(() => {
    const email = localStorage.getItem("email");
    if (!email) return;

    axios
      .get(`https://api-rim6ljimuq-uc.a.run.app/teachers/${email}`)
      .then((res) => {
        const fetched = res.data.teachers || [];
        const sorted = fetched.sort(
          (a: Teacher, b: Teacher) => (b.coins ?? 0) - (a.coins ?? 0)
        );
        setTeachers(sorted);
      })
      .catch((err) => console.error("Error fetching teachers:", err))
      .finally(() => null);
  }, []);

  const formatTimestamp = (time: any) => {
    if (!time) return "N/A";

    // Firestore timestamp
    if (time._seconds) {
      const date = new Date(time._seconds * 1000);
      return date.toLocaleString();
    }

    // If it's a string in DD/MM/YYYY hh:mm A
    if (typeof time === "string") {
      const parsed = dayjs(time, "DD/MM/YYYY hh:mm A");
      if (!parsed.isValid()) {
        return "Invalid Date";
      }
      return parsed.format("DD/MM/YYYY hh:mm A");
    }

    // If it's already a Date
    return time.toLocaleString();
  };

  const columns = [
    {
      title: "Subject",
      dataIndex: "ticketText",
      key: "ticketText",
      render: (text: string) => renderTicketSubject(text),
    },
    {
      title: "Created At",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (time: any) => {
        const formatted = formatTimestamp(time);
        return (
          <span className="text-gray-600 text-xs sm:text-sm">{formatted}</span>
        );
      },
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (category: string) => (
        <Tag color="blue">{category || "Student"}</Tag>
      ),
    },
    {
      title: "One On One Sessions",
      dataIndex: "oneononesessions",
      key: "oneononesessions",
      render: (oneononesessions: string) => (
        <Tag color="orange">
          <span className="text-black">{oneononesessions || 0}</span>
        </Tag>
      ),
    },
    {
      title: "Collaborators",
      dataIndex: "contributors",
      key: "contributors",
      render: (contributors?: Contributor[]) => {
        if (!contributors || contributors.length === 0) {
          return <Tag color="default">None</Tag>;
        }
        return (
          <Space wrap>
            {contributors.map((c) => (
              <Tag key={c.email} color="cyan">
                {c.name}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: "Started By",
      dataIndex: "userName",
      key: "userName",
      render: (userName: string) => (
        <span className="text-gray-600 text-xs sm:text-sm">
          {userName || "Anonymous"}
        </span>
      ),
    },
  ];

  // Mobile Card View Component
  const MobileTicketCard = ({ ticket }: { ticket: Ticket }) => (
    <div
      onClick={() => navigate(`/showticket/${ticket.id}?school=${typeof ticket.school === 'object' ? ticket.school?.SchoolName : ticket.school}`, { state: { ticket } })}
      className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow"
    >
      <div className="mb-3">
        <div className="text-xs text-gray-500 mb-1">Subject</div>
        {renderTicketSubject(ticket.ticketText)}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <div className="text-xs text-gray-500 mb-1">Category</div>
          <Tag color="blue">{ticket.category || "Student"}</Tag>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Sessions</div>
          <Tag color="orange">
            <span className="text-black">{ticket.oneononesessions || 0}</span>
          </Tag>
        </div>
      </div>

      <div className="mb-3">
        <div className="text-xs text-gray-500 mb-1">Collaborators</div>
        {!ticket.contributors || ticket.contributors.length === 0 ? (
          <Tag color="default">None</Tag>
        ) : (
          <Space wrap>
            {ticket.contributors.map((c) => (
              <Tag key={c.email} color="cyan" className="text-xs">
                {c.name}
              </Tag>
            ))}
          </Space>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-gray-500">Created: </span>
          <span className="text-gray-700">
            {formatTimestamp(ticket.timestamp)}
          </span>
        </div>
        <div className="text-right">
          <span className="text-gray-500">By: </span>
          <span className="text-gray-700">
            {ticket.userName || "Anonymous"}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6">
      {/* Title + Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
        <Title level={2} className="text-orange-600 m-0 text-xl sm:text-2xl">
          One - One Sessions{" "}
          <span className="text-gray-500 text-base sm:text-lg">
            ({tickets.length})
          </span>
        </Title>
        <div className="flex-1" />
        <div className="relative">
          <button
            className="flex items-center gap-2 bg-white hover:bg-orange-100 text-orange-600 border border-orange-300 px-3 sm:px-4 py-2 rounded-lg shadow-sm transition-all duration-200 font-medium text-sm"
            onClick={toggleFilters}
          >
            <FilterOutlined />
            Filter
          </button>

          {showFilters && (
            <div className="absolute top-12 right-0 mt-2 w-72 sm:w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1">
                  Select Teacher
                </label>
                <Select
                  showSearch
                  allowClear
                  placeholder="Search teachers"
                  optionFilterProp="children"
                  className="w-full"
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  value={selectedTeacher}
                  onChange={(value) => {
                    setSelectedTeacher(value);
                    setSelectedTeacherEmail(
                      teachers.find((t) => t.email === value)?.email || ""
                    );
                  }}
                >
                  {teachers.map((teacher) => (
                    <Select.Option key={teacher.email} value={teacher.email}>
                      {teacher.Name}
                    </Select.Option>
                  ))}
                </Select>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1">
                  Date Range
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <input
                    type="date"
                    className="w-full sm:flex-1 border rounded-md px-3 py-2 text-sm text-gray-700"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                  <span className="text-gray-500 text-sm whitespace-nowrap">
                    to
                  </span>
                  <input
                    type="date"
                    className="w-full sm:flex-1 border rounded-md px-3 py-2 text-sm text-gray-700"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1">
                  Category
                </label>
                <div className="flex flex-col gap-2 text-sm text-gray-700">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedCategory === "Student"}
                      onChange={() =>
                        setSelectedCategory(
                          selectedCategory === "Student" ? "" : "Student"
                        )
                      }
                    />
                    <span className="ml-2">Student</span>
                  </label>

                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedCategory === "Teacher"}
                      onChange={() =>
                        setSelectedCategory(
                          selectedCategory === "Teacher" ? "" : "Teacher"
                        )
                      }
                    />
                    <span className="ml-2">Teacher</span>
                  </label>

                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedCategory === "Early Adopter"}
                      onChange={() =>
                        setSelectedCategory(
                          selectedCategory === "Early Adopter"
                            ? ""
                            : "Early Adopter"
                        )
                      }
                    />
                    <span className="ml-2">Early Adopter</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <button
                  className="px-4 py-2 text-sm text-gray-600 hover:underline"
                  onClick={() => setShowFilters(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 text-sm text-red-600 border border-red-400 rounded-md hover:bg-red-100"
                  onClick={() => {
                    setSelectedStatus("");
                    setSelectedTeacher("");
                    setSelectedTeacherEmail("");
                    setFromDate("");
                    setToDate("");
                    setSelectedCategory("");
                    setShowFilters(false);
                  }}
                >
                  Clear Filters
                </button>
                <button
                  className="px-4 py-2 text-sm bg-orange-500 text-white rounded-md hover:bg-orange-600"
                  onClick={() => {
                    setShowFilters(false);
                    console.log("Apply filters");
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Academic Year Filter */}
      <AcademicYearFilter
        selectedYear={selectedYear}
        onChange={setSelectedYear}
        className="mb-4"
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <Spin tip="Loading tickets..." size="large" />
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <Table
              columns={columns}
              dataSource={tickets}
              rowKey="id"
              pagination={{ pageSize: 8 }}
              bordered
              onRow={(record) => ({
                onClick: () => {
                  navigate(`/showticket/${record.id}?school=${typeof record.school === 'object' ? record.school?.SchoolName : record.school}`, { state: { ticket: record } });
                },
              })}
              className="cursor-pointer rounded-xl shadow-md bg-white"
            />
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden">
            {tickets.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                No tickets found
              </div>
            ) : (
              tickets.map((ticket) => (
                <MobileTicketCard key={ticket.id} ticket={ticket} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default OneOnOneSessions;
