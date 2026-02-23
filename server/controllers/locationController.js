const Location = require("../models/Location");
const User = require("../models/User");
const SafeZone = require("../models/SafeZone");
const { getZoneStatus } = require("../utils/haversine");

// Patient updates their location
const updateLocation = async (req, res) => {
  const { latitude, longitude } = req.body;
  try {
    await Location.findOneAndUpdate(
      { patientId: req.user._id },
      { patientId: req.user._id, latitude, longitude },
      { upsert: true, new: true }
    );

    // Check safe zone using friend's field names
    const safeZone = await SafeZone.findOne({ patientId: req.user._id });
    if (safeZone) {
      const { status, distanceMetres } = getZoneStatus(
        latitude, longitude, {
          latitude: safeZone.centerLat,
          longitude: safeZone.centerLng,
          radius: safeZone.radius,
        }
      );

      // Emit real-time alert if outside
      if (status === "OUTSIDE") {
        req.io.emit("alert", {
          patientId: req.user._id,
          status,
          distanceMetres,
          latitude,
          longitude,
          message: `Patient is ${Math.round(distanceMetres)}m outside the safe zone!`,
        });
      }
    }

    res.status(200).json({ message: "Location updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Caregiver gets linked patient's location
const getPatientLocation = async (req, res) => {
  try {
    const caregiver = await User.findById(req.user._id);
    if (!caregiver.linkedPatient) {
      return res.status(404).json({ message: "No patient linked" });
    }

    const location = await Location.findOne({ patientId: caregiver.linkedPatient });
    if (!location) {
      return res.status(404).json({ message: "Patient location not available yet" });
    }

    res.status(200).json({
      latitude: location.latitude,
      longitude: location.longitude,
      updatedAt: location.updatedAt,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Caregiver links patient using code
const linkPatient = async (req, res) => {
  const { code } = req.body;
  try {
    const patient = await User.findOne({ patientCode: code, role: "patient" });
    if (!patient) {
      return res.status(404).json({ message: "Invalid patient code" });
    }

    await User.findByIdAndUpdate(req.user._id, { linkedPatient: patient._id });

    res.status(200).json({
      message: "Patient linked successfully",
      patient: {
        id: patient._id,
        username: patient.username,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get patient status
const getPatientStatus = async (req, res) => {
  try {
    const { patientId } = req.params;
    const location = await Location.findOne({ patientId });
    const safeZone = await SafeZone.findOne({ patientId });

    if (!location) {
      return res.status(404).json({ message: "No location data" });
    }

    let zoneStatus = null;
    if (safeZone) {
      zoneStatus = getZoneStatus(
        location.latitude, location.longitude, {
          latitude: safeZone.centerLat,
          longitude: safeZone.centerLng,
          radius: safeZone.radius,
        }
      );
    }

    res.status(200).json({
      lastLocation: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      status: zoneStatus?.status || "NO_ZONE_SET",
      distanceMetres: zoneStatus?.distanceMetres || null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { updateLocation, getPatientLocation, linkPatient, getPatientStatus };