const API_URL = "http://localhost:5000/api/auth";
const LOC_URL = "http://localhost:5000/api/location";

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

export const getUser = () => JSON.parse(localStorage.getItem("user"));
export const getToken = () => localStorage.getItem("token");

// Update patient location
export const updateLocation = async (latitude, longitude) => {
  const token = getToken();
  await fetch(`${LOC_URL}/update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ latitude, longitude }),
  });
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
  return data;
};