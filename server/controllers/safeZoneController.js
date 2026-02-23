const SafeZone = require("../models/SafeZone");

/**
 * 3️⃣ POST /api/set-safe-zone
 * Body: { patientId, centerLat, centerLng, radius }
 *
 * Saves (or updates) a circular safe zone for a patient in MongoDB SafeZones collection.
 */
const setSafeZone = async (req, res) => {
  try {
    const { patientId, centerLat, centerLng, radius } = req.body;

    if (!patientId || centerLat === undefined || centerLng === undefined || !radius) {
      return res.status(400).json({
        success: false,
        message: "patientId, centerLat, centerLng, and radius are all required",
      });
    }

    // Upsert — update if exists, insert if not
    const zone = await SafeZone.findOneAndUpdate(
      { patientId },
      {
        patientId,
        centerLat: parseFloat(centerLat),
        centerLng: parseFloat(centerLng),
        radius:    parseFloat(radius),
      },
      { upsert: true, new: true, runValidators: true }
    );

    return res.status(201).json({
      success: true,
      message: "Safe zone saved successfully",
      data:    zone,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/set-safe-zone/:patientId
 * Returns the saved safe zone for a patient.
 */
const getSafeZone = async (req, res) => {
  try {
    const zone = await SafeZone.findOne({ patientId: req.params.patientId });

    if (!zone)
      return res.status(404).json({ success: false, message: "No safe zone found for this patient" });

    return res.status(200).json({ success: true, data: zone });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { setSafeZone, getSafeZone };