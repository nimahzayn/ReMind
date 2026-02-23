import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../services/authService";

export default function Login() {
  const [mode, setMode] = useState("login"); // "login" or "signup"
  const [role, setRole] = useState("caregiver");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await loginUser(username, password, role);
        navigate(role === "caregiver" ? "/caregiver" : "/patient");
      } else {
        await registerUser(username, password, role);
        setSuccess("Account created! You can now log in.");
        setMode("login");
        setUsername("");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.blob1} />
      <div style={styles.blob2} />
      <div style={styles.card}>

        {/* Logo */}
        <div style={styles.logoWrap}>
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill="#3B82F6" opacity="0.15" />
            <path
              d="M16 8C11.582 8 8 11.582 8 16s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8zm0 3a2 2 0 110 4 2 2 0 010-4zm0 10.5c-2.667 0-5.02-1.374-6.4-3.45.032-2.12 4.267-3.283 6.4-3.283 2.124 0 6.368 1.163 6.4 3.283C21.02 20.126 18.667 21.5 16 21.5z"
              fill="#3B82F6"
            />
          </svg>
          <span style={styles.brand}>
            Remind<span style={styles.brandPlus}>+</span>
          </span>
        </div>

        <h1 style={styles.title}>
          {mode === "login" ? "Welcome Back" : "Create Account"}
        </h1>
        <p style={styles.subtitle}>Compassionate care, connected.</p>

        {/* Login / Signup Toggle */}
        <div style={styles.modeToggle}>
          <button
            style={mode === "login" ? styles.modeTabActive : styles.modeTab}
            onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
          >
            Login
          </button>
          <button
            style={mode === "signup" ? styles.modeTabActive : styles.modeTab}
            onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}
          >
            Sign Up
          </button>
        </div>

        {/* Caregiver / Patient Toggle */}
        <div style={styles.roleToggle}>
          <button
            style={role === "caregiver" ? styles.roleTabActive : styles.roleTab}
            onClick={() => { setRole("caregiver"); setError(""); }}
          >
            🩺 Caregiver
          </button>
          <button
            style={role === "patient" ? styles.roleTabActive : styles.roleTab}
            onClick={() => { setRole("patient"); setError(""); }}
          >
            🧡 Patient
          </button>
        </div>

        {/* Role Hint */}
        <div style={styles.roleHint}>
          {role === "caregiver" ? (
            <span>
              {mode === "login" ? "Login" : "Sign up"} as a <strong>Caregiver</strong> to monitor and manage your patient.
            </span>
          ) : (
            <span>
              {mode === "login" ? "Login" : "Sign up"} as a <strong>Patient</strong> to view your reminders and check-ins.
            </span>
          )}
        </div>

        {/* Success Message */}
        {success && <div style={styles.success}>{success}</div>}

        {/* Username */}
        <div style={styles.field}>
          <label style={styles.label}>Username</label>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
          />
        </div>

        {/* Password */}
        <div style={styles.field}>
          <label style={styles.label}>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
        </div>

        {/* Confirm Password (signup only) */}
        {mode === "signup" && (
          <div style={styles.field}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              style={styles.input}
            />
          </div>
        )}

        {/* Error */}
        {error && <div style={styles.error}>{error}</div>}

        {/* Submit Button */}
        <button
          style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
          onClick={handleSubmit}
          disabled={loading}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(59,130,246,0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 14px rgba(59,130,246,0.25)";
          }}
        >
          {loading
            ? mode === "login" ? "Logging in..." : "Creating account..."
            : mode === "login"
            ? `Login as ${role === "caregiver" ? "Caregiver" : "Patient"}`
            : `Sign Up as ${role === "caregiver" ? "Caregiver" : "Patient"}`}
        </button>

        {/* Switch mode link */}
        <p style={styles.switchText}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <span
            style={styles.switchLink}
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setSuccess(""); }}
          >
            {mode === "login" ? "Sign Up" : "Login"}
          </span>
        </p>

        <p style={styles.footer}>
          Remind+ helps Alzheimer's patients and their caregivers stay connected and safe.
        </p>
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
    background: "#F0F6FF",
    fontFamily: "'Georgia', serif",
    position: "relative",
    overflow: "hidden",
  },
  blob1: {
    position: "absolute",
    top: "-120px",
    left: "-120px",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(147,197,253,0.5) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  blob2: {
    position: "absolute",
    bottom: "-100px",
    right: "-100px",
    width: "350px",
    height: "350px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(196,181,253,0.4) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  card: {
    background: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(16px)",
    borderRadius: "24px",
    padding: "48px 40px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 4px 40px rgba(59,130,246,0.10), 0 1px 4px rgba(0,0,0,0.06)",
    border: "1px solid rgba(255,255,255,0.6)",
    textAlign: "center",
    position: "relative",
    zIndex: 1,
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "20px",
  },
  brand: { fontSize: "24px", fontWeight: "700", color: "#1E40AF", letterSpacing: "-0.5px" },
  brandPlus: { color: "#3B82F6" },
  title: { margin: "0 0 6px", fontSize: "26px", fontWeight: "700", color: "#1E293B" },
  subtitle: { margin: "0 0 20px", fontSize: "14px", color: "#64748B", fontStyle: "italic" },
  modeToggle: {
    display: "flex",
    borderRadius: "12px",
    overflow: "hidden",
    border: "1.5px solid #CBD5E1",
    marginBottom: "12px",
  },
  modeTab: {
    flex: 1,
    padding: "10px",
    border: "none",
    background: "#F8FAFC",
    color: "#64748B",
    fontSize: "14px",
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
    fontWeight: "500",
  },
  modeTabActive: {
    flex: 1,
    padding: "10px",
    border: "none",
    background: "#1E40AF",
    color: "#fff",
    fontSize: "14px",
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
    fontWeight: "600",
  },
  roleToggle: {
    display: "flex",
    borderRadius: "12px",
    overflow: "hidden",
    border: "1.5px solid #BFDBFE",
    marginBottom: "12px",
  },
  roleTab: {
    flex: 1,
    padding: "10px",
    border: "none",
    background: "#EFF6FF",
    color: "#64748B",
    fontSize: "14px",
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
    fontWeight: "500",
  },
  roleTabActive: {
    flex: 1,
    padding: "10px",
    border: "none",
    background: "#3B82F6",
    color: "#fff",
    fontSize: "14px",
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
    fontWeight: "600",
  },
  roleHint: {
    background: "#EFF6FF",
    border: "1px solid #BFDBFE",
    borderRadius: "10px",
    padding: "10px 14px",
    marginBottom: "16px",
    fontSize: "13px",
    color: "#1E40AF",
    lineHeight: "1.5",
    fontFamily: "system-ui, sans-serif",
    textAlign: "left",
  },
  success: {
    background: "#F0FDF4",
    border: "1px solid #BBF7D0",
    borderRadius: "10px",
    padding: "10px 14px",
    marginBottom: "14px",
    fontSize: "13px",
    color: "#166534",
    fontFamily: "system-ui, sans-serif",
    textAlign: "left",
  },
  field: { marginBottom: "14px", textAlign: "left" },
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: "600",
    color: "#475569",
    marginBottom: "6px",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    fontFamily: "system-ui, sans-serif",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1.5px solid #CBD5E1",
    background: "#F8FAFC",
    fontSize: "15px",
    color: "#1E293B",
    outline: "none",
    fontFamily: "system-ui, sans-serif",
    boxSizing: "border-box",
  },
  error: {
    background: "#FEF2F2",
    border: "1px solid #FECACA",
    borderRadius: "10px",
    padding: "10px 14px",
    marginBottom: "14px",
    fontSize: "13px",
    color: "#DC2626",
    fontFamily: "system-ui, sans-serif",
    textAlign: "left",
  },
  button: {
    width: "100%",
    padding: "15px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(59,130,246,0.25)",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
    fontFamily: "system-ui, sans-serif",
    marginTop: "4px",
  },
  switchText: {
    marginTop: "16px",
    fontSize: "13px",
    color: "#64748B",
    fontFamily: "system-ui, sans-serif",
  },
  switchLink: {
    color: "#3B82F6",
    fontWeight: "600",
    cursor: "pointer",
    textDecoration: "underline",
  },
  footer: {
    marginTop: "16px",
    fontSize: "12px",
    color: "#94A3B8",
    lineHeight: "1.6",
    fontFamily: "system-ui, sans-serif",
    fontStyle: "italic",
  },
};