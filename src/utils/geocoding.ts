const API_URL = 'http://localhost:5000';

export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const response = await fetch(
      `${API_URL}/api/geocode?lat=${lat}&lng=${lng}`
    );

    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }

    const data = await response.json();
    
    if (data.error) {
      return data.fallback;
    }

    return data.address;
  } catch (error) {
    console.warn('Geocoding failed:', error);
    return `${lat}, ${lng}`;
  }
};
