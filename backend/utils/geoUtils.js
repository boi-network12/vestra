// backend/utils/geoUtils.js

/**
 * Calculates the great-circle distance between two coordinates using the Haversine formula.
 * @param {number} lat1 - Latitude of first point in decimal degrees
 * @param {number} lon1 - Longitude of first point in decimal degrees
 * @param {number} lat2 - Latitude of second point in decimal degrees
 * @param {number} lon2 - Longitude of second point in decimal degrees
 * @returns {number} Distance in kilometers
 */
exports.haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Checks if a point is within a certain radius of another point.
 * @param {number} lat1 - Latitude of center point
 * @param {number} lon1 - Longitude of center point
 * @param {number} lat2 - Latitude of target point
 * @param {number} lon2 - Longitude of target point
 * @param {number} radiusKm - Radius in kilometers
 * @returns {boolean} True if within radius, false otherwise
 */
exports.isWithinRadius = (lat1, lon1, lat2, lon2, radiusKm) => {
  return exports.haversineDistance(lat1, lon1, lat2, lon2) <= radiusKm;
};

/**
 * Calculates a bounding box for a given coordinate and radius.
 * Useful for MongoDB $geoWithin or $geoIntersects queries.
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} radiusKm - Radius in kilometers
 * @returns {{minLat: number, maxLat: number, minLon: number, maxLon: number}}
 */
exports.getBoundingBox = (lat, lon, radiusKm) => {
  const R = 6371; // Earth radius in km
  const deltaLat = (radiusKm / R) * (180 / Math.PI);
  const deltaLon = (radiusKm / R) * (180 / Math.PI) / Math.cos((lat * Math.PI) / 180);

  return {
    minLat: lat - deltaLat,
    maxLat: lat + deltaLat,
    minLon: lon - deltaLon,
    maxLon: lon + deltaLon,
  };
};
