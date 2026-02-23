const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  updateLocation,
  getPatientLocation,
  linkPatient,
  getPatientStatus,
} = require("../controllers/locationController");

// Patient updates location
router.post("/update", protect, updateLocation);

// Caregiver gets patient location
router.get("/patient", protect, getPatientLocation);

// Caregiver links patient by code
router.post("/link", protect, linkPatient);

// Get patient status
router.get("/status/:patientId", protect, getPatientStatus);

module.exports = router;