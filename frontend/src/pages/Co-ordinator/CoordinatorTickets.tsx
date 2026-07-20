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
  Popconfirm,
  Modal,
  Space,
} from "antd";
import { PlusOutlined, FilterOutlined, EditOutlined, DeleteOutlined, MinusCircleOutlined, PlusCircleOutlined } from "@ant-design/icons";
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
  school?: any;
  oneononesessions?: number;
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

  // Edit / Delete state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [editTicketText, setEditTicketText] = useState("");
  const [editCategory, setEditCategory] = useState("Student");
  const [editStatus, setEditStatus] = useState("Ticket Raised");
  const [editOneOnOneSessions, setEditOneOnOneSessions] = useState(0);

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const email = localStorage.getItem("email");
  const school = localStorage.getItem("school");
  const wingId = localStorage.getItem("wingId");

  const navigate = useNavigate();

  const getTicketSchool = (ticket: any) => {
    if (!ticket) return school || localStorage.getItem("school") || "";
    if (typeof ticket.school === "object" && ticket.school?.SchoolName) {
      return ticket.school.SchoolName;
    }
    return ticket.school || school || localStorage.getItem("school") || "";
  };

  const handleDeleteTicket = async (ticket: Ticket) => {
    const schoolName = getTicketSchool(ticket);
    try {
      await axios.delete("https://api-rim6ljimuq-uc.a.run.app/tickets/delete", {
        data: { school: schoolName, ticketId: ticket.id },
      });
      setTickets((prev) => prev.filter((t) => t.id !== ticket.id));
      message.success("Ticket deleted successfully");
    } catch (err) {
      console.error(err);
      message.error("Failed to delete ticket");
    }
  };

  const handleSessionChange = async (ticket: Ticket, newCount: number) => {
    const schoolName = getTicketSchool(ticket);
    const count = Math.max(0, newCount);
    try {
      await axios.put("https://api-rim6ljimuq-uc.a.run.app/tickets/edit", {
        school: schoolName,
        ticketId: ticket.id,
        oneononesessions: count,
      });
      setTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, oneononesessions: count } : t))
      );
      message.success("One-on-One session count updated");
    } catch (err) {
      console.error(err);
      message.error("Failed to update session count");
    }
  };

  const handleOpenEditModal = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setEditTicketText(ticket.ticketText || "");
    setEditCategory(ticket.category || "Student");
    setEditStatus(ticket.status || "Ticket Raised");
    setEditOneOnOneSessions(ticket.oneononesessions || 0);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingTicket) return;
    const schoolName = getTicketSchool(editingTicket);
    try {
      await axios.put("https://api-rim6ljimuq-uc.a.run.app/tickets/edit", {
        school: schoolName,
        ticketId: editingTicket.id,
        ticketText: editTicketText,
        category: editCategory,
        status: editStatus,
        oneononesessions: editOneOnOneSessions,
      });
      setTickets((prev) =>
        prev.map((t) =>
          t.id === editingTicket.id
            ? {
                ...t,
                ticketText: editTicketText,
                category: editCategory,
                status: editStatus,
                oneononesessions: editOneOnOneSessions,
              }
            : t
        )
      );
      message.success("Ticket updated successfully");
      setIsEditModalOpen(false);
      setEditingTicket(null);
    } catch (err) {
      console.error(err);
      message.error("Failed to update ticket");
    }
  };

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

    try {
      setSubmitting(true);
      await axios.post(
        `https://api-rim6ljimuq-uc.a.run.app/raiseticket/${email}`,
        {
          ticketText: values.description,
          category: values.category,
        }
      );

      message.success("Ticket created!");
      setOpen(false);
      form.resetFields();

      // Refresh tickets
      const res = await axios.get(
        `https://api-rim6ljimuq-uc.a.run.app/co-ordinator/tickets/${wingId}`
      );
      setTickets(res.data.tickets || []);
    } catch (err) {
      console.error(err);
      message.error("Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Coordinator Tickets
          </Title>
          <span className="text-gray-500 text-sm">
            Manage tickets for your wing
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            icon={<FilterOutlined />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ background: "#fa8c16" }}
            onClick={() => setOpen(true)}
          >
            Raise Ticket
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
        <div className="mb-4 border p-4 rounded-lg shadow-sm w-72 bg-white">
          <label className="font-medium">Status</label>
          <Select
            className="w-full mb-3"
            value={selectedStatus}
            onChange={setSelectedStatus}
            allowClear
          >
            <Option value="Ticket Raised">Ticket Raised</Option>
            <Option value="Resolved">Resolved</Option>
          </Select>

          <label className="font-medium">Category</label>
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

      {/* TICKET LIST */}
      {isMobile ? (
        loading ? (
          <Spin />
        ) : tickets.length === 0 ? (
          <p>No tickets found for {selectedYear}.</p>
        ) : (
          tickets.map((t) => (
            <Card
              key={t.id}
              className="mb-3 cursor-pointer"
              onClick={() =>
                navigate(
                  `/showticket/${t.id}?school=${getTicketSchool(t)}`,
                  { state: { ticket: t } }
                )
              }
            >
              <div className="flex justify-between items-start">
                <div className="font-semibold text-blue-600">
                  {t.ticketText.length > 30
                    ? t.ticketText.substring(0, 30) + "..."
                    : t.ticketText}
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined className="text-blue-600" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditModal(t);
                    }}
                  />
                  <Popconfirm
                    title="Delete Ticket"
                    description="Delete this ticket?"
                    onConfirm={(e) => {
                      e?.stopPropagation();
                      handleDeleteTicket(t);
                    }}
                    onCancel={(e) => e?.stopPropagation()}
                    okText="Yes"
                    cancelText="No"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-2">
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

              <div className="flex items-center justify-between mt-2 pt-2 border-t text-xs">
                <span className="text-gray-500 font-medium">1-on-1 Sessions:</span>
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <Popconfirm
                    title="Remove Session"
                    description="Are you sure you want to remove one One-on-One session?"
                    onConfirm={(e) => {
                      e?.stopPropagation();
                      handleSessionChange(t, (t.oneononesessions || 0) - 1);
                    }}
                    onCancel={(e) => e?.stopPropagation()}
                    okText="Yes"
                    cancelText="No"
                    disabled={(t.oneononesessions || 0) <= 0}
                  >
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<MinusCircleOutlined className="text-base" />}
                      disabled={(t.oneononesessions || 0) <= 0}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>
                  <span className="font-semibold min-w-[16px] text-center">
                    {t.oneononesessions || 0}
                  </span>
                  <Popconfirm
                    title="Add Session"
                    description="Are you sure you want to add a new One-on-One session?"
                    onConfirm={(e) => {
                      e?.stopPropagation();
                      handleSessionChange(t, (t.oneononesessions || 0) + 1);
                    }}
                    onCancel={(e) => e?.stopPropagation()}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button
                      type="text"
                      size="small"
                      icon={<PlusCircleOutlined className="text-base text-orange-500" />}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>
                </div>
              </div>

              <div className="text-gray-500 mt-1 text-xs">
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
            {
              title: "1-on-1 Sessions",
              key: "oneononesessions",
              render: (_: any, record: Ticket) => (
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <Popconfirm
                    title="Remove Session"
                    description="Are you sure you want to remove one One-on-One session?"
                    onConfirm={(e) => {
                      e?.stopPropagation();
                      handleSessionChange(record, (record.oneononesessions || 0) - 1);
                    }}
                    onCancel={(e) => e?.stopPropagation()}
                    okText="Yes"
                    cancelText="No"
                    disabled={(record.oneononesessions || 0) <= 0}
                  >
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<MinusCircleOutlined className="text-base" />}
                      disabled={(record.oneononesessions || 0) <= 0}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>
                  <span className="font-semibold text-sm min-w-[16px] text-center">
                    {record.oneononesessions || 0}
                  </span>
                  <Popconfirm
                    title="Add Session"
                    description="Are you sure you want to add a new One-on-One session?"
                    onConfirm={(e) => {
                      e?.stopPropagation();
                      handleSessionChange(record, (record.oneononesessions || 0) + 1);
                    }}
                    onCancel={(e) => e?.stopPropagation()}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button
                      type="text"
                      size="small"
                      icon={<PlusCircleOutlined className="text-base text-orange-500" />}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>
                </div>
              ),
            },
            {
              title: "Actions",
              key: "actions",
              render: (_: any, record: Ticket) => (
                <Space onClick={(e) => e.stopPropagation()}>
                  <Tooltip title="Edit Ticket">
                    <Button
                      type="text"
                      icon={<EditOutlined className="text-blue-600 hover:text-blue-800" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditModal(record);
                      }}
                    />
                  </Tooltip>
                  <Tooltip title="Delete Ticket">
                    <Popconfirm
                      title="Delete Ticket"
                      description="Are you sure you want to delete this ticket?"
                      onConfirm={(e) => {
                        e?.stopPropagation();
                        handleDeleteTicket(record);
                      }}
                      onCancel={(e) => e?.stopPropagation()}
                      okText="Yes"
                      cancelText="No"
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Popconfirm>
                  </Tooltip>
                </Space>
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
                `/showticket/${record.id}?school=${getTicketSchool(record)}`,
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

      {/* EDIT TICKET MODAL */}
      <Modal
        title="Edit Ticket"
        open={isEditModalOpen}
        onOk={handleSaveEdit}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingTicket(null);
        }}
        okText="Save Changes"
        okButtonProps={{ className: "bg-orange-500 hover:bg-orange-600" }}
      >
        <div className="flex flex-col gap-4 my-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Ticket Text / Description
            </label>
            <Input.TextArea
              rows={4}
              value={editTicketText}
              onChange={(e) => setEditTicketText(e.target.value)}
              placeholder="Enter ticket details..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Category
            </label>
            <Select
              className="w-full"
              value={editCategory}
              onChange={setEditCategory}
              options={[
                { label: "Student", value: "Student" },
                { label: "Teacher", value: "Teacher" },
                { label: "Early Adopter", value: "Early Adopter" },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Status
            </label>
            <Select
              className="w-full"
              value={editStatus}
              onChange={setEditStatus}
              options={[
                { label: "Ticket Raised", value: "Ticket Raised" },
                { label: "In Progress", value: "In Progress" },
                { label: "Resolved", value: "Resolved" },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              One on One Sessions
            </label>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setEditOneOnOneSessions((prev) => Math.max(0, prev - 1))}
                danger
                disabled={editOneOnOneSessions <= 0}
              >
                -
              </Button>
              <span className="font-bold text-base min-w-[24px] text-center">
                {editOneOnOneSessions}
              </span>
              <Button
                onClick={() => setEditOneOnOneSessions((prev) => prev + 1)}
                className="bg-orange-500 text-white hover:bg-orange-600"
              >
                +
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CoordinatorTickets;
