import { useEffect, useState } from "react";
// import Divider from "../components/Divider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faUserCircle } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Modal, Popconfirm, Button, message, Input, Select, Tooltip } from "antd";
import { EditOutlined, DeleteOutlined, MinusCircleOutlined, PlusCircleOutlined } from "@ant-design/icons";

type Ticket = {
  id: string;
  userName?: string;
  email?: string;
  ticketText?: string;
  status?: string;
  timestamp?: string;
  tocken?: string;
  category?: string;
  school?: any;
  oneononesessions?: number;
};

function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const email = localStorage.getItem("email");
  const navigate = useNavigate();

  // Edit / Delete state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [editTicketText, setEditTicketText] = useState("");
  const [editCategory, setEditCategory] = useState("Student");
  const [editStatus, setEditStatus] = useState("Ticket Raised");
  const [editOneOnOneSessions, setEditOneOnOneSessions] = useState(0);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await axios.get(
          `https://api-rim6ljimuq-uc.a.run.app/tickets/${email}`
        );
        setTickets(response.data.tickets || []);
      } catch (error) {
        console.error("Error fetching tickets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [email]);

  const getTicketSchool = (ticket: any) => {
    if (!ticket) return localStorage.getItem("school") || "";
    if (typeof ticket.school === "object" && ticket.school?.SchoolName) {
      return ticket.school.SchoolName;
    }
    return ticket.school || localStorage.getItem("school") || "";
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

  const filteredTickets = tickets.filter((ticket) =>
    ticket.userName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTicketClick = (ticket: Ticket) => {
    navigate(`/showticket/${ticket.id}?school=${typeof ticket.school === 'object' ? ticket.school.SchoolName : ticket.school}`, { state: { ticket } });
  };

  return (
    <div>
      <div className="flex flex-row">
        <h1 className="text-5xl text-black mt-4 ml-7">Tickets</h1>
        <button
          className="fixed top-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg w-40 h-15 text-xl"
          onClick={() => (window.location.href = "/addticket")}
        >
          Add Tickets +
        </button>
      </div>

      <div className="w-full h-px bg-gray-500 my-8" />

      <div className="relative mt-6 ml-7">
        <FontAwesomeIcon
          icon={faSearch}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          className="bg-white rounded-3xl w-[30%] h-9 pl-10 pr-4 text-sm focus:outline-none border border-gray-500"
          placeholder="Search by teacher name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="w-full h-px bg-gray-500 my-8" />

      {loading ? (
        <div className="text-center text-gray-500 mt-10 text-lg">
          Loading tickets...
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center text-gray-500 mt-10 text-lg">
          No data found
        </div>
      ) : (
        <>
          <div className="grid grid-cols-8 gap-4 font-semibold px-4 mb-4 text-sm">
            <div>Teacher Name</div>
            <div>Email</div>
            <div>Subject</div>
            <div>Status</div>
            <div>Created At</div>
            <div>Token</div>
            <div>1-on-1 Sessions</div>
            <div>Actions</div>
          </div>

          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => handleTicketClick(ticket)}
              className="cursor-pointer grid grid-cols-8 gap-4 bg-gray-100 px-4 py-3 items-center rounded-md mb-2 hover:bg-gray-200"
            >
              <div className="flex items-center space-x-3">
                <FontAwesomeIcon
                  icon={faUserCircle}
                  className="text-3xl text-gray-400"
                />
                <span className="text-sm">{ticket.userName || "NaN"}</span>
              </div>
              <div className="text-sm break-words">{ticket.email || "NaN"}</div>
              <div className="text-sm break-words">
                {ticket.ticketText && ticket.ticketText.length > 20
                  ? `${ticket.ticketText.slice(0, 10)}...`
                  : ticket.ticketText || "NaN"}
              </div>

              <div className="text-sm">{ticket.status || "Pending"}</div>
              <div className="text-sm">{ticket.timestamp || "Unknown"}</div>
              <div className="text-sm">{ticket.tocken ?? "NaN"}</div>

              {/* 1-on-1 Session Counter */}
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <Popconfirm
                  title="Remove Session"
                  description="Are you sure you want to remove one One-on-One session?"
                  onConfirm={(e) => {
                    e?.stopPropagation();
                    handleSessionChange(ticket, (ticket.oneononesessions || 0) - 1);
                  }}
                  onCancel={(e) => e?.stopPropagation()}
                  okText="Yes"
                  cancelText="No"
                  disabled={(ticket.oneononesessions || 0) <= 0}
                >
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<MinusCircleOutlined className="text-lg" />}
                    disabled={(ticket.oneononesessions || 0) <= 0}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Popconfirm>
                <span className="font-semibold text-sm min-w-[16px] text-center">
                  {ticket.oneononesessions || 0}
                </span>
                <Popconfirm
                  title="Add Session"
                  description="Are you sure you want to add a new One-on-One session?"
                  onConfirm={(e) => {
                    e?.stopPropagation();
                    handleSessionChange(ticket, (ticket.oneononesessions || 0) + 1);
                  }}
                  onCancel={(e) => e?.stopPropagation()}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<PlusCircleOutlined className="text-lg text-orange-500" />}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Popconfirm>
              </div>

              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Tooltip title="Edit Ticket">
                  <Button
                    type="text"
                    icon={<EditOutlined className="text-blue-600" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditModal(ticket);
                    }}
                  />
                </Tooltip>
                <Tooltip title="Delete Ticket">
                  <Popconfirm
                    title="Delete Ticket"
                    description="Delete this ticket?"
                    onConfirm={(e) => {
                      e?.stopPropagation();
                      handleDeleteTicket(ticket);
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
              </div>
            </div>
          ))}
        </>
      )}

      {/* Edit Ticket Modal */}
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
}

export default Tickets;
