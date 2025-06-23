const axios = require('axios');

/**
 * Validates and processes location data from the request or falls back to IP-based geocoding.
 * @param {Object} locationFromRequest - Location data from the request body (latitude, longitude, city, country).
 * @param {string} ipAddress - Client's IP address for fallback geocoding.
 * @returns {Object} Processed location object { coordinates: [longitude, latitude], city, country }.
 */
const processLocation = async (locationFromRequest, ipAddress) => {
  let location = {
    coordinates: [],
    city: '',
    country: ''
  };

  
  try {
    if (locationFromRequest && locationFromRequest.latitude && locationFromRequest.longitude) {
      const { latitude, longitude, city, country } = locationFromRequest;
      if (
        typeof latitude === 'number' &&
        typeof longitude === 'number' &&
        latitude >= -90 && latitude <= 90 &&
        longitude >= -180 && longitude <= 180
      ) {
        location = {
          coordinates: [longitude, latitude],
          city: city || '',
          country: country || '',
        };
      } else {
        console.warn('Invalid coordinates provided:', { latitude, longitude });
      }
    }

    if (!location.coordinates && ipAddress && ipAddress !== '::1' && !ipAddress.startsWith('192.168.')) {
      const response = await axios.get(`http://ip-api.com/json/${ipAddress}`);
      if (response.data.status === 'success') {
        location = {
          coordinates: [response.data.lon, response.data.lat],
          city: response.data.city || '',
          country: response.data.country || '',
        };
      } else {
        console.error('IP geolocation failed:', response.data);
      }
    } else {
      console.warn('No valid IP address for geolocation:', ipAddress);
    }
  } catch (err) {
    console.error('IP geolocation error:', err.message);
  }
  return location;
};


module.exports = {
  processLocation,
};