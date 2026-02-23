const API_URL = "http://10.10.168.224:5000/api/auth";
const LOC_URL = "http://10.10.168.224:5000/api/location";
const SAFEZONE_URL = "http://10.10.168.224:5000/api/safezone";

export const loginUser = async (username, password, role) => {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, role }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Login failed");
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  return data;
};

export const registerUser = async (username, password, role) => {
  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, role }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Registration failed");
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  return data;
};

export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const getUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const getToken = () => localStorage.getItem("token");

// Update patient location
export const updateLocation = async (latitude, longitude) => {
  const token = getToken();
  const response = await fetch(`${LOC_URL}/update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ latitude, longitude }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
};

// Get patient location (for caregiver)
export const getPatientLocation = async () => {
  const token = getToken();
  const response = await fetch(`${LOC_URL}/patient`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
};

// Link patient by code (for caregiver)
export const linkPatient = async (code) => {
  const token = getToken();
  const response = await fetch(`${LOC_URL}/link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ code }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  localStorage.setItem("user", JSON.stringify(data.user));
  return data;
};

// Get safe zone for patient
export const getSafeZone = async (patientId) => {
  try {
    const token = getToken();
    const response = await fetch(`${SAFEZONE_URL}/${patientId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error fetching safe zone:", err);
    return null;
  }
};

// Save safe zone
export const saveSafeZone = async (patientId, centerLat, centerLng, radius) => {
  const token = getToken();
  const response = await fetch(SAFEZONE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      patientId,
      centerLat,
      centerLng,
      radius,
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to save safe zone");
  return data;
};