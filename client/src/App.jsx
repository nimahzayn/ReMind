import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import CaregiverDashboard from "./pages/CaregiverDashboard";
import PatientPage from "./pages/PatientPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/caregiver" element={<CaregiverDashboard />} />
        <Route path="/patient" element={<PatientPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}