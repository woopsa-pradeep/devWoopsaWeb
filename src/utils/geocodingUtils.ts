/**
 * Utility functions for Google Maps Geocoding API
 */

export interface GeocodeAddressResult {
  lat: number;
  long: number;
  City: string;
  Country: string;
  Address: string;
  State: string;
  Zip: string | number;
}

export interface GeocodeResponse {
  results: Array<{
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }>;
  status: string;
}

/**
 * Geocodes an address using Google Maps Geocoding API
 * @param address - Street address
 * @param city - City name
 * @param state - State code (2 letters)
 * @param country - Country name (optional)
 * @param zip - Zip code
 * @returns Geocoded address result with lat/long and formatted address
 */
export const geocodeAddress = async (
  address: string,
  city: string,
  state: string,
  country: string = '',
  zip: string = ''
): Promise<GeocodeAddressResult | null> => {
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.error('Google Maps API key is not configured');
    return null;
  }

  // Build the address string for geocoding
  const addressParts: string[] = [];
  if (address) addressParts.push(address);
  if (city) addressParts.push(city);
  if (state) addressParts.push(state);
  if (zip) addressParts.push(zip);
  if (country) addressParts.push(country);

  const fullAddress = addressParts.join(', ');

  try {
    const encodedAddress = encodeURIComponent(fullAddress);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

    const response = await fetch(url);
    const data: GeocodeResponse = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0];
      const location = result.geometry.location;
      const formattedAddress = result.formatted_address;

      // Extract address components
      let extractedCity = city;
      let extractedState = state;
      let extractedCountry = country || 'USA';
      let extractedZip = zip;

      // Parse address components from Google's response
      result.address_components.forEach((component) => {
        if (component.types.includes('locality')) {
          extractedCity = component.long_name;
        } else if (component.types.includes('administrative_area_level_1')) {
          extractedState = component.short_name;
        } else if (component.types.includes('country')) {
          extractedCountry = component.long_name;
        } else if (component.types.includes('postal_code')) {
          extractedZip = component.long_name;
        }
      });

      return {
        lat: location.lat,
        long: location.lng,
        City: extractedCity,
        Country: extractedCountry,
        Address: formattedAddress,
        State: extractedState,
        Zip: extractedZip,
      };
    } else {
      console.error('Geocoding failed:', data.status);
      return null;
    }
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
};

