import React, { useEffect, useState } from "react";
import {
  Button,
  Drawer,
  Form,
  Input,
  message,
  Typography,
  Select,
  Spin,
  Table,
  Tag,
  Tooltip,
  Grid,
  Card,
} from "antd";
import { PlusOutlined, FilterOutlined } from "@ant-design/icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { getCurrentAcademicYear } from "../../utils/academicYear";
import AcademicYearFilter from "../../components/AcademicYearFilter";

const { Title } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

type Ticket = {
  id: string;
  ticketText: string;
  status?: string;
  timestamp?: any;
  category?: string;
};

const CoordinatorTickets = () => {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>();
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [selectedYear, setSelectedYear] = useState<string>(getCurrentAcademicYear());

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const email = localStorage.getItem("email");
  const school = localStorage.getItem("school");
  const wingId = localStorage.getItem("wingId");

  const navigate = useNavigate();

  const formatTimestamp = (t: any) => {
    if (!t) return "N/A";
    if (t._seconds) {
      return dayjs(t._seconds * 1000).format("DD/MM/YYYY hh:mm A");
    }
    return dayjs(t).format("DD/MM/YYYY hh:mm A");
  };

  useEffect(() => {
    if (!wingId) {
      setLoading(false);
      return;
    }

    const fetchTickets = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (selectedStatus) params.status = selectedStatus;
        if (selectedCategory) params.category = selectedCategory;
        if (selectedYear) params.academicYear = selectedYear;

        const res = await axios.get(
          `https://api-rim6ljimuq-uc.a.run.app/co-ordinator/tickets/${wingId}`,
          { params }
        );

        setTickets(res.data.tickets || []);
      } catch (err) {
        console.error(err);
        message.error("Failed to fetch tickets");
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [selectedStatus, selectedCategory, selectedYear, wingId]);

  const handleSubmit = async (values: any) => {
    if (!email || !school) {
      message.error("Missing user info");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        school,
        ticketText: values.description,
        category: values.category,
      };

      await axios.post(
        `https://api-rim6ljimuq-uc.a.run.app/raiseticket/${email}`,
        payload
      );

      message.success("Ticket created successfully");
      setOpen(false);
      form.resetFields();
    } catch (err) {
      console.error(err);
      message.error("Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: isMobile ? 14 : 24, background: "#fff" }}>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <Title level={isMobile ? 4 : 3}>
          Tickets ({tickets.length})
        </Title>

        <div className="flex gap-2">
          <Button
            icon={<FilterOutlined />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filter
          </Button>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ background: "#fa8c16" }}
            onClick={() => setOpen(true)}
          >
            Add Ticket
          </Button>
        </div>
      </div>

      {/* ACADEMIC YEAR FILTER */}
      <AcademicYearFilter
        selectedYear={selectedYear}
        onChange={setSelectedYear}
        className="mb-4"
      />

      {/* STATUS / CATEGORY FILTERS */}
      {showFilters && (
        <div className="mb-4 border p-4 rounded-lg shadow-sm w-72">
          <label>Status</label>
          <Select
            className="w-full mb-3"
            value={selectedStatus}
            onChange={setSelectedStatus}
            allowClear
          >
            <Option value="Ticket Raised">Ticket Raised</Option>
            <Option value="Resolved">Resolved</Option>
          </Select>

          <label>Category</label>
          <Select
            className="w-full"
            value={selectedCategory}
            onChange={setSelectedCategory}
            allowClear
          >
            <Option value="Teacher">Teacher</Option>
            <Option value="Student">Student</Option>
          </Select>
        </div>
      )}

      {/* MOBILE VIEW */}
      {isMobile ? (
        loading ? (
          <div className="flex justify-center py-20">
            <Spin size="large" />
          </div>
        ) : tickets.length === 0 ? (
          <p>No tickets found for {selectedYear}.</p>
        ) : (
          tickets.map((t) => (
            <Card
              key={t.id}
              className="mb-3 cursor-pointer"
              onClick={() =>
                navigate(
                  `/showticket/${t.id}?school=${
                    typeof (t as any).school === "object"
                      ? (t as any).school.SchoolName
                      : (t as any).school
                  }`,
                  { state: { ticket: t } }
                )
              }
            >
              <div className="font-semibold text-blue-600">
                {t.ticketText.length > 30
                  ? t.ticketText.substring(0, 30) + "..."
                  : t.ticketText}
              </div>

              <div className="mt-2">
                <Tag
                  color={
                    t.status === "Resolved"
                      ? "green"
                      : t.status === "Ticket Raised"
                      ? "orange"
                      : "blue"
                  }
                >
                  {t.status || "Pending"}
                </Tag>

                <Tag color={t.category === "Teacher" ? "green" : "blue"}>
                  {t.category}
                </Tag>
              </div>

              <div className="text-gray-500 mt-1">
                {formatTimestamp(t.timestamp)}
              </div>
            </Card>
          ))
        )
      ) : (
        <Table
          columns={[
            {
              title: "Subject",
              dataIndex: "ticketText",
              key: "ticketText",
              render: (text: string) => (
                <Tooltip title={text}>
                  <span className="font-medium text-blue-600">
                    {text.length > 40 ? text.substring(0, 40) + "..." : text}
                  </span>
                </Tooltip>
              ),
            },
            {
              title: "Status",
              dataIndex: "status",
              key: "status",
              render: (status: string) => (
                <Tag
                  color={
                    status === "Resolved"
                      ? "green"
                      : status === "Ticket Raised"
                      ? "orange"
                      : "blue"
                  }
                >
                  {status || "Pending"}
                </Tag>
              ),
            },
            {
              title: "Created",
              dataIndex: "timestamp",
              key: "timestamp",
              render: (t: any) => formatTimestamp(t),
            },
            {
              title: "Category",
              dataIndex: "category",
              key: "category",
              render: (cat: string) => (
                <Tag color={cat === "Teacher" ? "green" : "blue"}>{cat}</Tag>
              ),
            },
          ]}
          dataSource={tickets}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: `No tickets found for ${selectedYear}` }}
          onRow={(record) => ({
            onClick: () =>
              navigate(
                `/showticket/${record.id}?school=${
                  typeof (record as any).school === "object"
                    ? (record as any).school.SchoolName
                    : (record as any).school
                }`,
                { state: { ticket: record } }
              ),
          })}
        />
      )}

      {/* CREATE TICKET DRAWER */}
      <Drawer
        title="Create Ticket"
        open={open}
        onClose={() => setOpen(false)}
        width={isMobile ? "100%" : 420}
      >
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="Teacher">Teacher</Option>
              <Option value="Student">Student</Option>
            </Select>
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            block
            style={{ background: "#fa8c16" }}
          >
            Submit
          </Button>
        </Form>
      </Drawer>
    </div>
  );
};

export default CoordinatorTickets;
