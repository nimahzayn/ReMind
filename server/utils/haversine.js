/**
 * 5️⃣ haversine.js
 *
 * Accepts two coordinate points and returns distance in metres.
 * Also exports a helper to directly check SAFE / OUTSIDE status.
 *
 * Usage:
 *   const { haversineDistance, getZoneStatus } = require("../utils/haversine");
 *
 *   const dist   = haversineDistance(lat1, lng1, lat2, lng2); // metres
 *   const status = getZoneStatus(patientLat, patientLng, zone); // "SAFE" | "OUTSIDE"
 */

/**
 * Returns distance in metres between two lat/lng points.
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number} distance in metres
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R     = 6371000; // Earth radius in metres
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Compares a patient's position against their safe zone.
 * @param {number} patientLat
 * @param {number} patientLng
 * @param {{ centerLat: number, centerLng: number, radius: number }} zone
 * @returns {{ status: "SAFE"|"OUTSIDE", distanceMetres: number }}
 */
function getZoneStatus(patientLat, patientLng, zone) {
  const distanceMetres = haversineDistance(
    patientLat, patientLng,
    zone.centerLat, zone.centerLng
  );

  return {
    status:         distanceMetres <= zone.radius ? "SAFE" : "OUTSIDE",
    distanceMetres: Math.round(distanceMetres),
  };
}

module.exports = { haversineDistance, getZoneStatus };