import { useEffect, useRef, useState } from "react";
import { getPatientLocation, linkPatient, getUser } from "../services/authService";

export default function LiveLocation() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [linked, setLinked] = useState(false);
  const [code, setCode] = useState("");
  const [linkError, setLinkError] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const user = getUser();

  useEffect(() => {
    if (user?.linkedPatient) {
      setLinked(true);
      initMap();
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!linked) return;
    const interval = setInterval(async () => {
      try {
        const loc = await getPatientLocation();
        setLocation(loc);
        setError("");
        if (markerRef.current && mapInstanceRef.current) {
          markerRef.current.setLatLng([loc.latitude, loc.longitude]);
          mapInstanceRef.current.setView([loc.latitude, loc.longitude]);
        }
      } catch (err) {
        setError(err.message);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [linked]);

  const initMap = async () => {
    try {
      const loc = await getPatientLocation();
      setLocation(loc);
      setLoading(false);

      if (mapInstanceRef.current) return;

      const L = window.L;
      const map = L.map(mapRef.current).setView([loc.latitude, loc.longitude], 15);
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      const patientIcon = L.divIcon({
        html: `<div style="background:#3B82F6;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
        iconSize: [20, 20],
        className: "",
      });

      markerRef.current = L.marker([loc.latitude, loc.longitude], { icon: patientIcon })
        .addTo(map)
        .bindPopup("📍 Patient Location")
        .openPopup();

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleLink = async () => {
    if (!code || code.length !== 6) {
      setLinkError("Please enter a valid 6-digit code.");
      return;
    }
    setLinkLoading(true);
    setLinkError("");
    try {
      await linkPatient(code);
      const updatedUser = { ...user, linkedPatient: true };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setLinked(true);
      initMap();
    } catch (err) {
      setLinkError(err.message);
    } finally {
      setLinkLoading(false);
    }
  };

  return (
    <div>
      <h2 style={styles.title}>📍 Patient Live Location</h2>
      <p style={styles.sub}>Real-time location of your linked patient.</p>

      {!linked && (
        <div style={styles.linkBox}>
          <p style={styles.linkTitle}>🔗 Link Your Patient</p>
          <p style={styles.linkHint}>
            Ask your patient for their 6-digit code and enter it below.
          </p>
          <div style={styles.linkRow}>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={code}
              maxLength={6}
              onChange={(e) => setCode(e.target.value)}
              style={styles.codeInput}
            />
            <button
              style={styles.linkBtn}
              onClick={handleLink}
              disabled={linkLoading}
            >
              {linkLoading ? "Linking..." : "Link Patient"}
            </button>
          </div>
          {linkError && <p style={styles.linkError}>{linkError}</p>}
        </div>
      )}

      {linked && (
        <>
          {loading && (
            <div style={styles.loadingBox}>⏳ Getting patient location...</div>
          )}
          {error && <div style={styles.errorBox}>{error}</div>}
          {location && (
            <div style={styles.infoBox}>
              <span>🌐 Lat: <strong>{location.latitude?.toFixed(5)}</strong></span>
              <span>🌐 Lng: <strong>{location.longitude?.toFixed(5)}</strong></span>
              <span style={styles.liveTag}>🔴 LIVE</span>
            </div>
          )}
          <div ref={mapRef} style={styles.map} />
        </>
      )}
    </div>
  );
}

const styles = {
  title: { fontSize: "20px", color: "#1E40AF", margin: "0 0 6px" },
  sub: { fontSize: "14px", color: "#64748B", marginBottom: "16px" },
  linkBox: {
    background: "#F8FAFC",
    border: "1.5px solid #CBD5E1",
    borderRadius: "14px",
    padding: "24px",
    marginBottom: "20px",
  },
  linkTitle: { fontSize: "16px", fontWeight: "700", color: "#1E293B", marginBottom: "6px" },
  linkHint: { fontSize: "13px", color: "#64748B", marginBottom: "16px" },
  linkRow: { display: "flex", gap: "12px" },
  codeInput: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1.5px solid #CBD5E1",
    fontSize: "20px",
    letterSpacing: "6px",
    fontWeight: "700",
    textAlign: "center",
    outline: "none",
    color: "#1E293B",
  },
  linkBtn: {
    padding: "12px 20px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  linkError: { color: "#DC2626", fontSize: "13px", marginTop: "10px" },
  loadingBox: {
    background: "#EFF6FF",
    border: "1px solid #BFDBFE",
    borderRadius: "10px",
    padding: "12px 16px",
    marginBottom: "12px",
    fontSize: "14px",
    color: "#1E40AF",
  },
  errorBox: {
    background: "#FEF2F2",
    border: "1px solid #FECACA",
    borderRadius: "10px",
    padding: "12px 16px",
    marginBottom: "12px",
    fontSize: "14px",
    color: "#DC2626",
  },
  infoBox: {
    display: "flex",
    gap: "20px",
    alignItems: "center",
    background: "#F0FDF4",
    border: "1px solid #BBF7D0",
    borderRadius: "10px",
    padding: "10px 16px",
    marginBottom: "12px",
    fontSize: "14px",
    color: "#166534",
  },
  liveTag: {
    marginLeft: "auto",
    background: "#DC2626",
    color: "#fff",
    padding: "3px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
  },
  map: {
    width: "100%",
    height: "450px",
    borderRadius: "14px",
    border: "1px solid #E2E8F0",
  },
};
