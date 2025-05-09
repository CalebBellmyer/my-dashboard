// --- Imports ---
import { OPENWEATHERMAP_API_KEY } from "$env/static/private";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";


// --- Load Function ---
export const load: PageServerLoad = async ({ fetch, locals }) => {

    const apiKey = OPENWEATHERMAP_API_KEY;

    const lat = 36.27;
    const lon = -95.85;
    const units = 'imperial';

    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`;

    try {
        const response = await fetch(apiUrl);

        if (!response.ok){
            console.error(`Weather API error: ${response.status} ${response.statusText}`)
            return {
                weather: null,
                error: `Failed to fetch Weather: ${response.statusText || response.status}`
            }
        }

        const weatherData = await response.json();

        return {
            weather: {
                temp: weatherData.main?.temp,
                description: weatherData.weather?.[0]?.description,
                icon: weatherData.weather?.[0]?.icon,
                cityName: weatherData.name
            },
            error: null
        };

    } catch (e) {
        console.error("Error fetching weather data: ", e);
        return {
            weather: null,
            error: "Could not connect to the weather service. Pleasetry again later."
        }
    }

};