import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LiveLocation from "../components/LiveLocation";
import SafeZone from "../components/SafeZone";

export default function CaregiverDashboard() {
  const [activeTab, setActiveTab] = useState("location");
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.brand}>
          🩺 <strong>Remind+</strong> Caregiver Dashboard
        </div>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          ← Logout
        </button>
      </div>

      {/* Tabs */}
      <div style={styles.tabBar}>
        <button
          style={activeTab === "location" ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab("location")}
        >
          📍 Live Location
        </button>
        <button
          style={activeTab === "safezone" ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab("safezone")}
        >
          🛡️ Safe Zone
        </button>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {activeTab === "location" ? <LiveLocation /> : <SafeZone />}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#F0F6FF",
    fontFamily: "system-ui, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 32px",
    background: "#fff",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  brand: {
    fontSize: "18px",
    color: "#1E40AF",
  },
  logoutBtn: {
    padding: "8px 20px",
    borderRadius: "10px",
    border: "1.5px solid #CBD5E1",
    background: "#fff",
    color: "#475569",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  tabBar: {
    display: "flex",
    gap: "12px",
    padding: "20px 32px 0",
  },
  tab: {
    padding: "12px 28px",
    borderRadius: "12px 12px 0 0",
    border: "none",
    background: "#E2E8F0",
    color: "#64748B",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
  tabActive: {
    padding: "12px 28px",
    borderRadius: "12px 12px 0 0",
    border: "none",
    background: "#fff",
    color: "#1E40AF",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 -2px 8px rgba(59,130,246,0.08)",
  },
  content: {
    background: "#fff",
    margin: "0 32px 32px",
    borderRadius: "0 12px 12px 12px",
    padding: "24px",
    boxShadow: "0 4px 20px rgba(59,130,246,0.08)",
  },
};