import { useEffect, useState } from "react";
import { Table, Typography, message, Spin, Tag, Card, Grid } from "antd";
import axios from "axios";
import { UserOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { getCurrentAcademicYear } from "../../utils/academicYear";
import AcademicYearFilter from "../../components/AcademicYearFilter";

const { Title } = Typography;
const { useBreakpoint } = Grid;

const CoordinatorTeachers = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>(getCurrentAcademicYear());
  const wingId = localStorage.getItem("wingId");
  const name = localStorage.getItem("UserName");
  const screens = useBreakpoint();

  const isMobile = !screens.md;

  useEffect(() => {
    const fetchTeachers = async () => {
      if (!wingId) {
        message.error("No coordinator wingId found in localStorage");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await axios.get(
          `https://api-rim6ljimuq-uc.a.run.app/co-ordinator/teachers/${wingId}`,
          { params: { academicYear: selectedYear } }
        );
        setTeachers(response.data.teachers || []);
      } catch (err: any) {
        console.error("Error fetching teachers:", err);
        message.error(err.response?.data?.error || "Failed to fetch teachers");
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, [wingId, selectedYear]);

  const columns: ColumnsType<any> = [
    {
      title: "#",
      key: "index",
      width: 60,
      render: (_: any, __: any, index: number) => (
        <Tag color="orange">{index + 1}</Tag>
      ),
      responsive: ["md"],
    },
    {
      title: "Name",
      dataIndex: "Name",
      key: "Name",
      render: (name: string) => (
        <span style={{ fontWeight: 600, color: "#ff7a00" }}>
          <UserOutlined style={{ marginRight: 6 }} />
          {name}
        </span>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (email: string) => (
        <span style={{ color: "#595959" }}>{email}</span>
      ),
    },
    {
      title: "School",
      dataIndex: "school",
      key: "school",
      render: (school: string) => (
        <Tag color="orange" style={{ borderRadius: 6 }}>
          {school}
        </Tag>
      ),
      responsive: ["md"],
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
      render: (dept: string) => (
        <span style={{ color: "#ff8c1a", fontWeight: 500 }}>{dept}</span>
      ),
    },
    {
      title: "Coins",
      dataIndex: "coins",
      key: "coins",
      sorter: (a: any, b: any) => a.coins - b.coins,
      render: (coins: number) => (
        <Tag
          color={coins > 100 ? "gold" : "volcano"}
          style={{ fontWeight: 600, borderRadius: 6 }}
        >
          {coins}
        </Tag>
      ),
    },
    {
      title: "Courses",
      dataIndex: "courses",
      key: "courses",
      render: (courses: string[]) =>
        courses?.length ? (
          <ul style={{ paddingLeft: 18, margin: 0 }}>
            {courses.map((c, i) => (
              <li key={i} style={{ color: "#444", lineHeight: "20px" }}>
                {c}
              </li>
            ))}
          </ul>
        ) : (
          <span style={{ color: "#999" }}>—</span>
        ),
    },
  ];

  return (
    <div
      style={{
        padding: isMobile ? "16px" : "24px",
        backgroundColor: "#ffffff",
        minHeight: "100vh",
      }}
    >
      {/* Title */}
      <Title
        level={isMobile ? 4 : 3}
        style={{
          color: "#ff7a00",
          borderBottom: "2px solid #ffb84d",
          paddingBottom: 8,
          marginBottom: 16,
          fontSize: isMobile ? "20px" : "28px",
        }}
      >
        Teachers under Coordinator:{" "}
        <span style={{ color: "#333" }}>{name || "Unknown"}</span>
      </Title>

      {/* Academic Year Filter */}
      <AcademicYearFilter
        selectedYear={selectedYear}
        onChange={setSelectedYear}
        className="mb-5"
      />

      {/* Loading */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "50px 0" }}>
          <Spin size="large" tip="Loading teachers..." />
        </div>
      ) : isMobile ? (
        /* MOBILE VIEW */
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {teachers.length === 0 ? (
            <div style={{ textAlign: "center", color: "#999", padding: "40px 0" }}>
              No teachers found for {selectedYear}.
            </div>
          ) : (
            teachers.map((t: any) => (
              <Card
                key={t.id}
                style={{ border: "1px solid #ffe0b3", borderRadius: 12, padding: 12 }}
              >
                <div style={{ fontSize: 16, fontWeight: 600, color: "#ff7a00" }}>
                  <UserOutlined style={{ marginRight: 6 }} />
                  {t.Name}
                </div>
                <div style={{ marginTop: 6, color: "#444" }}>{t.email}</div>
                <div style={{ marginTop: 6 }}>
                  <Tag color="orange">{t.school}</Tag>
                  <Tag color="volcano" style={{ marginLeft: 6 }}>
                    {t.department}
                  </Tag>
                </div>
                <div style={{ marginTop: 6 }}>
                  <Tag
                    color={t.coins > 100 ? "gold" : "volcano"}
                    style={{ fontWeight: 600 }}
                  >
                    Coins: {t.coins}
                  </Tag>
                </div>
                <div style={{ marginTop: 6 }}>
                  <strong>Courses:</strong>
                  <br />
                  {t.courses?.length ? (
                    <ul style={{ marginTop: 4, paddingLeft: 18 }}>
                      {t.courses.map((c: string, i: number) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  ) : (
                    <span style={{ color: "#999" }}>None</span>
                  )}
                </div>
              </Card>
            ))
          )}

          {teachers.length > 0 && (
            <div
              style={{ textAlign: "center", marginTop: 16, color: "#ff7a00", fontWeight: 600 }}
            >
              Total Teachers: {teachers.length}
            </div>
          )}
        </div>
      ) : (
        /* DESKTOP TABLE */
        <Table
          columns={columns}
          dataSource={teachers}
          rowKey="id"
          bordered
          tableLayout="fixed"
          locale={{ emptyText: `No teachers found for ${selectedYear}` }}
          pagination={{
            pageSize: 5,
            position: ["bottomCenter"],
            showSizeChanger: false,
          }}
          scroll={{ x: true }}
          style={{ border: "1px solid #ffe0b3", borderRadius: 10 }}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={6}>
                  <strong style={{ color: "#ff7a00" }}>Total Teachers:</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <strong style={{ color: "#ff7a00" }}>{teachers.length}</strong>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      )}
    </div>
  );
};

export default CoordinatorTeachers;
