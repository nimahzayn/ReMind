import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, logoutUser, updateLocation } from "../services/authService";

export default function PatientPage() {
  const navigate = useNavigate();
  const user = getUser();
  const [locationStatus, setLocationStatus] = useState("Starting...");
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    // Continuously send location to backend
    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ latitude, longitude });
        setLocationStatus("✅ Location being shared");
        await updateLocation(latitude, longitude);
      },
      () => {
        setLocationStatus("❌ Location access denied");
      },
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const handleLogout = () => {
    logoutUser();
    navigate("/");
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.icon}>🧡</div>
        <h1 style={styles.title}>Hello, {user?.username}!</h1>
        <p style={styles.sub}>
          Your caregiver is keeping an eye on you and is just a call away.
        </p>

        {/* Patient Code */}
        <div style={styles.codeBox}>
          <p style={styles.codeLabel}>🔑 Your Patient Code</p>
          <div style={styles.code}>{user?.patientCode}</div>
          <p style={styles.codeHint}>Share this code with your caregiver to link your accounts.</p>
        </div>

        {/* Location Status */}
        <div style={styles.locationBox}>
          <p style={styles.locationLabel}>📍 Location Sharing</p>
          <p style={styles.locationStatus}>{locationStatus}</p>
          {coords && (
            <p style={styles.coords}>
              {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
            </p>
          )}
        </div>

        {/* Reminders */}
        <div style={styles.reminderBox}>
          <p style={styles.reminderTitle}>📋 Today's Reminders</p>
          <div style={styles.reminder}>💊 Take morning medication — 8:00 AM</div>
          <div style={styles.reminder}>🥗 Eat breakfast — 8:30 AM</div>
          <div style={styles.reminder}>🚶 Morning walk — 9:00 AM</div>
          <div style={styles.reminder}>💊 Take afternoon medication — 1:00 PM</div>
        </div>

        <button style={styles.logoutBtn} onClick={handleLogout}>
          ← Logout
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#FFF7F0",
    fontFamily: "system-ui, sans-serif",
    padding: "20px",
  },
  card: {
    background: "#fff",
    borderRadius: "24px",
    padding: "48px 40px",
    maxWidth: "440px",
    width: "100%",
    boxShadow: "0 4px 40px rgba(251,146,60,0.10)",
    textAlign: "center",
  },
  icon: { fontSize: "48px", marginBottom: "16px" },
  title: { fontSize: "26px", fontWeight: "700", color: "#C2410C", margin: "0 0 8px" },
  sub: { fontSize: "14px", color: "#64748B", lineHeight: "1.6", marginBottom: "20px" },
  codeBox: {
    background: "#FFF7ED",
    border: "2px solid #FED7AA",
    borderRadius: "14px",
    padding: "16px",
    marginBottom: "16px",
  },
  codeLabel: { fontSize: "13px", fontWeight: "700", color: "#92400E", marginBottom: "8px" },
  code: {
    fontSize: "36px",
    fontWeight: "800",
    color: "#C2410C",
    letterSpacing: "8px",
    marginBottom: "8px",
  },
  codeHint: { fontSize: "12px", color: "#92400E" },
  locationBox: {
    background: "#F0FDF4",
    border: "1px solid #BBF7D0",
    borderRadius: "12px",
    padding: "12px 16px",
    marginBottom: "16px",
    textAlign: "left",
  },
  locationLabel: { fontSize: "13px", fontWeight: "700", color: "#166534", marginBottom: "4px" },
  locationStatus: { fontSize: "14px", color: "#166534" },
  coords: { fontSize: "12px", color: "#94A3B8", marginTop: "4px" },
  reminderBox: {
    background: "#FFF7ED",
    border: "1px solid #FED7AA",
    borderRadius: "14px",
    padding: "16px",
    marginBottom: "20px",
    textAlign: "left",
  },
  reminderTitle: { fontWeight: "700", color: "#C2410C", marginBottom: "10px", fontSize: "14px" },
  reminder: {
    fontSize: "14px",
    color: "#1E293B",
    padding: "8px 0",
    borderBottom: "1px solid #FED7AA",
    lineHeight: "1.4",
  },
  logoutBtn: {
    padding: "12px 28px",
    borderRadius: "12px",
    border: "1.5px solid #CBD5E1",
    background: "#fff",
    color: "#475569",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
};