
import { OPENWEATHERMAP_API_KEY } from '$env/static/private'; // Your secret API key
import { error, json } from '@sveltejs/kit'; // SvelteKit helpers for responses
import type { RequestHandler } from './$types'; // Type for the request handler

// This is the GET request handler for the /api/weather endpoint
export const GET: RequestHandler = async ({ url }) => {
  // Get latitude and longitude from the query parameters of the incoming request
  const lat = url.searchParams.get('lat');
  const lon = url.searchParams.get('lon');

  // Validate that lat and lon are provided
  if (!lat || !lon) {
    // If lat or lon are missing, throw a 400 Bad Request error
    throw error(400, 'Latitude and longitude are required query parameters.');
  }

  const apiKey = OPENWEATHERMAP_API_KEY;
  const units = 'imperial'; // For Fahrenheit

  // Construct the URL to call the OpenWeatherMap API
  const openWeatherMapApiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`;

  try {
    // Make the actual call to the OpenWeatherMap API
    // Note: SvelteKit's 'fetch' can be used server-side, but for external APIs,
    // the global 'fetch' is also available and often simpler here.
    const weatherResponse = await fetch(openWeatherMapApiUrl);

    // Check if the request to OpenWeatherMap was successful
    if (!weatherResponse.ok) {
      // If OpenWeatherMap returned an error, try to parse its error message
      const errorData = await weatherResponse.json().catch(() => null); // Attempt to parse error JSON
      console.error('OpenWeatherMap API Error:', weatherResponse.status, errorData);
      // Forward a generic error or a more specific one if available
      throw error(weatherResponse.status, errorData?.message || 'Failed to fetch weather from external service.');
    }

    // Parse the successful JSON response from OpenWeatherMap
    const weatherData = await weatherResponse.json();

    // Extract only the data we want to send back to our client-side widget
    // This prevents leaking unnecessary data or your API key structure.
    const clientWeatherData = {
      temp: weatherData.main?.temp,
      description: weatherData.weather?.[0]?.description,
      icon: weatherData.weather?.[0]?.icon,
      cityName: weatherData.name,
      // You can add more fields here if needed, e.g., humidity, wind
      // humidity: weatherData.main?.humidity,
      // windSpeed: weatherData.wind?.speed,
    };

    // Return the processed weather data as a JSON response to our client-side widget
    return json(clientWeatherData);

  } catch (e: any) {
    // Catch any unexpected errors during the fetch process (e.g., network issues)
    console.error('Error in /api/weather endpoint:', e);
    // Throw a generic 500 Internal Server Error
    throw error(500, e.message || 'An internal server error occurred while fetching weather.');
  }
};
