import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getPatientLocation, getUser, getSafeZone, saveSafeZone } from "../services/authService";
import { io } from "socket.io-client";

export default function SafeZone() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const circleRef = useRef(null);
  const markerRef = useRef(null);
  const [radius, setRadius] = useState(200);
  const [center, setCenter] = useState(null);
  const [patientLocation, setPatientLocation] = useState(null);
  const [alertMsg, setAlertMsg] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [linked, setLinked] = useState(false);
  const [distance, setDistance] = useState(null);
  const user = getUser();

  // Check if patient is linked
  useEffect(() => {
    console.log("✅ SafeZone component mounted");
    console.log("User:", user);
    
    if (user?.linkedPatient) {
      console.log("✅ Patient linked");
      setLinked(true);
    } else {
      console.log("❌ No linked patient");
      setLoading(false);
    }
  }, []);

  // Initialize map AFTER component renders (use separate effect)
  useEffect(() => {
    if (!linked) return;
    
    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      console.log("🔍 Now initializing map (DOM ready)");
      initMap();
    }, 100);

    return () => clearTimeout(timer);
  }, [linked]);

  // Real-time socket alert
  useEffect(() => {
    const socket = io("http://10.10.168.224:5000");
    socket.on("alert", (data) => {
      setAlertMsg(`🚨 REAL-TIME ALERT! Patient is ${Math.round(data.distanceMetres)}m outside the safe zone!`);
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
        
        if (mapInstanceRef.current && markerRef.current) {
          markerRef.current.setLatLng([loc.latitude, loc.longitude]);
        }
      } catch (err) {
        console.error("Error fetching patient location:", err);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [linked]);

  // Check distance whenever location or center changes
  useEffect(() => {
    if (!center || !patientLocation) return;
    
    const dist = getDistance(
      center.lat,
      center.lng,
      patientLocation.lat,
      patientLocation.lng
    );
    
    setDistance(Math.round(dist));
    
    if (dist > radius) {
      setAlertMsg(
        `🚨 ALERT! Patient is ${Math.round(dist)}m away — outside the safe zone! (Limit: ${radius}m)`
      );
    } else {
      setAlertMsg("");
    }
  }, [patientLocation, center, radius]);

  // Calculate distance between two coordinates (Haversine formula)
  const getDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371000; // Earth radius in meters
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

  // Initialize Leaflet map
  const initMap = async () => {
    console.log("🔍 initMap called");
    console.log("mapRef.current:", mapRef.current);
    
    if (!mapRef.current) {
      console.error("❌ mapRef.current is still null");
      return;
    }
    
    if (mapInstanceRef.current) {
      console.log("❌ Map already initialized");
      return;
    }

    try {
      console.log("🔍 Initializing SafeZone map...");

      // Get patient location
      const loc = await getPatientLocation();
      console.log("✅ Got patient location:", loc);
      
      const patLoc = { lat: loc.latitude, lng: loc.longitude };
      setPatientLocation(patLoc);

      // Fetch saved safe zone
      console.log("🔍 Fetching saved safe zone for patient:", user?.linkedPatient);
      const savedZone = await getSafeZone(user?.linkedPatient);
      
      let centerLat, centerLng, radVal;
      
      if (savedZone) {
        console.log("✅ Saved zone found:", savedZone);
        centerLat = savedZone.latitude;
        centerLng = savedZone.longitude;
        radVal = savedZone.radiusMeters;
        setCenter({ lat: centerLat, lng: centerLng });
        setRadius(radVal);
        setSaved(true);
      } else {
        console.log("ℹ️ No saved zone, using patient location");
        centerLat = loc.latitude;
        centerLng = loc.longitude;
        radVal = 200;
        setCenter({ lat: centerLat, lng: centerLng });
        setRadius(radVal);
      }

      // Create map instance
      console.log("🔍 Creating Leaflet map...");
      const map = L.map(mapRef.current);
      map.setView([loc.latitude, loc.longitude], 15);
      mapInstanceRef.current = map;
      console.log("✅ Map instance created");

      // Add tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);
      console.log("✅ Tile layer added");

      // Draw safe zone circle
      circleRef.current = L.circle([centerLat, centerLng], {
        radius: radVal,
        color: "#3B82F6",
        fillColor: "#93C5FD",
        fillOpacity: 0.2,
        weight: 2,
      }).addTo(map);
      console.log("✅ Safe zone circle drawn");

      // Patient location marker
      const patientIcon = L.divIcon({
        html: `<div style="background:#EF4444;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
        iconSize: [20, 20],
        className: "",
      });

      markerRef.current = L.marker([loc.latitude, loc.longitude], {
        icon: patientIcon,
      })
        .addTo(map)
        .bindPopup("🧡 Patient Location")
        .openPopup();
      console.log("✅ Patient marker added");

      // Click to set safe zone center
      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        console.log("🔍 Map clicked at:", lat, lng);
        setCenter({ lat, lng });
        circleRef.current.setLatLng([lat, lng]);
        setSaved(false);
      });

      setLoading(false);
      console.log("✅ SafeZone map initialized successfully");
    } catch (err) {
      console.error("❌ Error initializing map:", err);
      setLoading(false);
    }
  };

  // Handle radius change
  const handleRadiusChange = (e) => {
    const r = Number(e.target.value);
    console.log("🔍 Radius changed to:", r);
    setRadius(r);
    setSaved(false);
    if (circleRef.current) {
      circleRef.current.setRadius(r);
    }
  };

  // Save safe zone to database
  const handleSave = async () => {
    console.log("🔍 handleSave called");
    console.log("Center:", center);
    console.log("Radius:", radius);
    
    if (!center) {
      console.error("❌ Center is not set");
      window.alert("❌ Please click on the map to set the safe zone center first");
      return;
    }

    try {
      console.log("💾 Saving safe zone...");
      await saveSafeZone(user?.linkedPatient, center.lat, center.lng, radius);
      setSaved(true);
      window.alert("✅ Safe zone saved successfully!");
      console.log("✅ Safe zone saved");
    } catch (err) {
      console.error("❌ Failed to save safe zone:", err);
      window.alert("❌ Failed to save safe zone: " + err.message);
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
    <div style={styles.container}>
      <h2 style={styles.title}>🛡️ Safe Zone Settings</h2>
      <p style={styles.sub}>
        Click anywhere on the map to move the safe zone center. Use the slider to adjust radius.
      </p>

      {/* Alert Box */}
      {alertMsg && (
        <div style={styles.alertBox}>
          {alertMsg}
          <button
            onClick={() => setAlertMsg("")}
            style={{
              marginLeft: "10px",
              cursor: "pointer",
              background: "none",
              border: "none",
              color: "inherit",
              fontSize: "18px",
              fontWeight: "bold",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Success Box */}
      {!alertMsg && saved && (
        <div style={styles.successBox}>
          ✅ Patient is inside the safe zone. ({distance}m away from center)
        </div>
      )}

      {/* Distance Info */}
      {distance !== null && (
        <div style={styles.distanceBox}>
          📏 Patient is <strong>{distance}m</strong> from center. Radius:{" "}
          <strong>{radius}m</strong>. Status:{" "}
          <strong style={{ color: distance <= radius ? "#16a34a" : "#dc2626" }}>
            {distance <= radius ? "✅ Inside" : "🚨 Outside"}
          </strong>
        </div>
      )}

      {/* Controls */}
      <div style={styles.controls}>
        <div style={styles.controlItem}>
          <label style={styles.label}>
            Radius: <strong>{radius}m</strong>
          </label>
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

      {/* Info Box */}
      {center && (
        <div style={styles.infoBox}>
          <span>
            📍 Center: <strong>{center.lat.toFixed(5)}, {center.lng.toFixed(5)}</strong>
          </span>
          <span>
            🔴 Patient:{" "}
            <strong>
              {patientLocation?.lat.toFixed(5)}, {patientLocation?.lng.toFixed(5)}
            </strong>
          </span>
        </div>
      )}

      {/* Loading */}
      {loading && <div style={styles.loadingBox}>⏳ Loading map...</div>}

      {/* Map Container */}
      <div ref={mapRef} style={styles.map} />
    </div>
  );
}

const styles = {
  container: {
    padding: "16px",
  },
  title: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#1E40AF",
    margin: "0 0 8px",
  },
  sub: {
    fontSize: "14px",
    color: "#64748B",
    marginBottom: "16px",
  },
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
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  successBox: {
    background: "#F0FDF4",
    border: "1px solid #BBF7D0",
    borderRadius: "10px",
    padding: "12px 16px",
    marginBottom: "14px",
    fontSize: "14px",
    color: "#166534",
    fontWeight: "600",
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
    flexWrap: "wrap",
  },
  controlItem: {
    flex: 1,
    minWidth: "200px",
  },
  label: {
    display: "block",
    fontSize: "14px",
    color: "#475569",
    marginBottom: "8px",
    fontWeight: "600",
  },
  slider: {
    width: "100%",
    accentColor: "#3B82F6",
    cursor: "pointer",
    height: "6px",
  },
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
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    transition: "transform 0.2s",
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
    textAlign: "center",
  },
  map: {
    width: "100%",
    height: "500px",
    borderRadius: "14px",
    border: "1px solid #E2E8F0",
    marginTop: "16px",
  },
};