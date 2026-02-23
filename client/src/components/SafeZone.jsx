import { useEffect, useRef, useState } from "react";
import { getPatientLocation, getUser, getToken } from "../services/authService";
import { io } from "socket.io-client";

export default function SafeZone() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const circleRef = useRef(null);
  const markerRef = useRef(null);
  const [radius, setRadius] = useState(200);
  const [center, setCenter] = useState(null);
  const [patientLocation, setPatientLocation] = useState(null);
  const [alert, setAlert] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [linked, setLinked] = useState(false);
  const [distance, setDistance] = useState(null);
  const user = getUser();

  useEffect(() => {
    if (user?.linkedPatient) {
      setLinked(true);
      initMap();
    } else {
      setLoading(false);
    }
  }, []);

  // Real-time socket alert
  useEffect(() => {
    const socket = io("http://localhost:5000");
    socket.on("alert", (data) => {
      setAlert(`🚨 REAL-TIME ALERT! Patient is ${Math.round(data.distanceMetres)}m outside the safe zone!`);
    });
    return () => socket.disconnect();
  }, []);

  // Poll patient location every 5 seconds
  useEffect(() => {
    if (!linked) return;
    const interval = setInterval(async () => {
      try {
        const loc = await getPatientLocation();
        setPatientLocation({ lat: loc.latitude, lng: loc.longitude });
        if (markerRef.current) {
          markerRef.current.setLatLng([loc.latitude, loc.longitude]);
        }
      } catch (err) {
        console.error(err);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [linked]);

  // Check distance whenever location or center changes
  useEffect(() => {
    if (!center || !patientLocation) return;
    const dist = getDistance(
      center.lat, center.lng,
      patientLocation.lat, patientLocation.lng
    );
    setDistance(Math.round(dist));
    if (dist > radius) {
      setAlert(`🚨 ALERT! Patient is ${Math.round(dist)}m away — outside the safe zone! (Limit: ${radius}m)`);
    } else {
      setAlert("");
    }
  }, [patientLocation, center, radius]);

  // Haversine formula
  const getDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const initMap = async () => {
    if (!mapRef.current || mapInstanceRef.current) return;
    try {
      const loc = await getPatientLocation();
      const patLoc = { lat: loc.latitude, lng: loc.longitude };
      setPatientLocation(patLoc);
      setCenter(patLoc);
      setLoading(false);

      const L = window.L;
      const map = L.map(mapRef.current).setView([loc.latitude, loc.longitude], 15);
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      // Safe zone circle
      circleRef.current = L.circle([loc.latitude, loc.longitude], {
        radius: radius,
        color: "#3B82F6",
        fillColor: "#93C5FD",
        fillOpacity: 0.2,
        weight: 2,
      }).addTo(map);

      // Patient marker
      const patientIcon = L.divIcon({
        html: `<div style="background:#EF4444;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
        iconSize: [20, 20],
        className: "",
      });

      markerRef.current = L.marker([loc.latitude, loc.longitude], { icon: patientIcon })
        .addTo(map)
        .bindPopup("🧡 Patient Location")
        .openPopup();

      // Click map to move safe zone center
      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        setCenter({ lat, lng });
        circleRef.current.setLatLng([lat, lng]);
        setSaved(false);
      });

    } catch (err) {
      setLoading(false);
    }
  };

  const handleRadiusChange = (e) => {
    const r = Number(e.target.value);
    setRadius(r);
    setSaved(false);
    if (circleRef.current) circleRef.current.setRadius(r);
  };

  const handleSave = async () => {
    try {
      const token = getToken();
      const response = await fetch("http://localhost:5000/api/safezone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId: user?.linkedPatient,
          centerLat: center.lat,
          centerLng: center.lng,
          radius: radius,
        }),
      });

      if (response.ok) {
        setSaved(true);
      }
    } catch (err) {
      console.error("Failed to save safe zone:", err);
    }
  };

  if (!linked) {
    return (
      <div>
        <h2 style={styles.title}>🛡️ Safe Zone</h2>
        <div style={styles.notLinked}>
          ⚠️ Please link a patient first from the <strong>Live Location</strong> tab.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={styles.title}>🛡️ Safe Zone Settings</h2>
      <p style={styles.sub}>
        Click anywhere on the map to move the safe zone center. Use the slider to adjust radius.
      </p>

      {/* Alert */}
      {alert && <div style={styles.alertBox}>{alert}</div>}

      {/* Safe */}
      {!alert && saved && (
        <div style={styles.successBox}>
          ✅ Patient is inside the safe zone. ({distance}m away from center)
        </div>
      )}

      {/* Distance */}
      {distance !== null && (
        <div style={styles.distanceBox}>
          📏 Patient is <strong>{distance}m</strong> from center. Radius: <strong>{radius}m</strong>.
          Status:{" "}
          <strong style={{ color: distance <= radius ? "#16a34a" : "#dc2626" }}>
            {distance <= radius ? "✅ Inside" : "🚨 Outside"}
          </strong>
        </div>
      )}

      {/* Controls */}
      <div style={styles.controls}>
        <div style={styles.controlItem}>
          <label style={styles.label}>Radius: <strong>{radius}m</strong></label>
          <input
            type="range"
            min="50"
            max="2000"
            step="50"
            value={radius}
            onChange={handleRadiusChange}
            style={styles.slider}
          />
          <div style={styles.rangeLabels}>
            <span>50m</span>
            <span>2000m</span>
          </div>
        </div>
        <button style={styles.saveBtn} onClick={handleSave}>
          💾 Save Safe Zone
        </button>
      </div>

      {center && (
        <div style={styles.infoBox}>
          <span>📍 Center: <strong>{center.lat.toFixed(5)}, {center.lng.toFixed(5)}</strong></span>
          <span>🔴 Patient: <strong>{patientLocation?.lat.toFixed(5)}, {patientLocation?.lng.toFixed(5)}</strong></span>
        </div>
      )}

      {loading && <div style={styles.loadingBox}>⏳ Loading map...</div>}

      <div ref={mapRef} style={styles.map} />
    </div>
  );
}

const styles = {
  title: { fontSize: "20px", color: "#1E40AF", margin: "0 0 6px" },
  sub: { fontSize: "14px", color: "#64748B", marginBottom: "16px" },
  notLinked: {
    background: "#FFF7ED",
    border: "1px solid #FED7AA",
    borderRadius: "12px",
    padding: "20px",
    fontSize: "15px",
    color: "#92400E",
  },
  alertBox: {
    background: "#FEF2F2",
    border: "2px solid #DC2626",
    borderRadius: "10px",
    padding: "14px 16px",
    marginBottom: "14px",
    fontSize: "15px",
    color: "#DC2626",
    fontWeight: "700",
  },
  successBox: {
    background: "#F0FDF4",
    border: "1px solid #BBF7D0",
    borderRadius: "10px",
    padding: "12px 16px",
    marginBottom: "14px",
    fontSize: "14px",
    color: "#166534",
  },
  distanceBox: {
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: "10px",
    padding: "12px 16px",
    marginBottom: "14px",
    fontSize: "14px",
    color: "#334155",
  },
  controls: {
    display: "flex",
    alignItems: "flex-end",
    gap: "24px",
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "12px",
  },
  controlItem: { flex: 1 },
  label: {
    display: "block",
    fontSize: "14px",
    color: "#475569",
    marginBottom: "8px",
    fontWeight: "600",
  },
  slider: { width: "100%", accentColor: "#3B82F6", cursor: "pointer" },
  rangeLabels: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12px",
    color: "#94A3B8",
    marginTop: "4px",
  },
  saveBtn: {
    padding: "12px 24px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  infoBox: {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
    background: "#EFF6FF",
    border: "1px solid #BFDBFE",
    borderRadius: "10px",
    padding: "10px 16px",
    marginBottom: "12px",
    fontSize: "13px",
    color: "#1E40AF",
  },
  loadingBox: {
    background: "#EFF6FF",
    border: "1px solid #BFDBFE",
    borderRadius: "10px",
    padding: "12px 16px",
    marginBottom: "12px",
    fontSize: "14px",
    color: "#1E40AF",
  },
  map: {
    width: "100%",
    height: "450px",
    borderRadius: "14px",
    border: "1px solid #E2E8F0",
  },
};
