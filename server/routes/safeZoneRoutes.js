const express = require("express");
const router  = express.Router();
const { setSafeZone, getSafeZone } = require("../controllers/safeZoneController");
const { protect } = require("../middleware/authMiddleware");

// POST /api/set-safe-zone
router.post("/",             protect, setSafeZone);

// GET  /api/set-safe-zone/:patientId
router.get("/:patientId",    protect, getSafeZone);

module.exports = router;