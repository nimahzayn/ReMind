const mongoose = require("mongoose");

const safeZoneSchema = new mongoose.Schema(
  {
    patientId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    label:        { type: String, default: "Safe Zone" },
    latitude:     { type: Number, required: true },
    longitude:    { type: Number, required: true },
    radiusMeters: { type: Number, required: true, min: 10 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SafeZone", safeZoneSchema);