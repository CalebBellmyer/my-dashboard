<script lang="ts">
  import { onMount } from 'svelte';

  // Local state for the weather data, error, and loading status
  let localWeather: {
    temp?: number;
    description?: string;
    icon?: string;
    cityName?: string;
  } | null = null;
  let localError: string | null = null;
  let isLoading: boolean = true; // Start in loading state

  const iconBaseUrl = "https://openweathermap.org/img/wn/";
  $: iconUrl = localWeather?.icon ? `${iconBaseUrl}${localWeather.icon}@2x.png` : null;

  // --- Caching Constants ---
  const CACHE_KEY_WEATHER = 'cachedWeatherData';
  const CACHE_KEY_TIMESTAMP = 'cachedWeatherTimestamp';
  const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

  // Function to fetch weather data (will be called if cache is stale or missing)
  async function fetchWeatherData(lat: number, lon: number) {
    isLoading = true;
    localError = null; // Clear previous errors
    try {
      const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      localWeather = data;

      // Save to cache
      localStorage.setItem(CACHE_KEY_WEATHER, JSON.stringify(data));
      localStorage.setItem(CACHE_KEY_TIMESTAMP, Date.now().toString());
      console.log("WeatherWidget: Fetched new data and cached it.");

    } catch (e: any) {
      console.error("Error fetching weather:", e);
      localError = e.message || "Failed to fetch weather data.";
      localWeather = null; // Clear weather data on error
    } finally {
      isLoading = false;
    }
  }

  onMount(async () => {
    const cachedWeatherString = localStorage.getItem(CACHE_KEY_WEATHER);
    const cachedTimestampString = localStorage.getItem(CACHE_KEY_TIMESTAMP);

    if (cachedWeatherString && cachedTimestampString) {
      const cachedTimestamp = parseInt(cachedTimestampString, 10);
      const now = Date.now();

      if (now - cachedTimestamp < CACHE_DURATION_MS) {
        // Cache is fresh, use it
        try {
          localWeather = JSON.parse(cachedWeatherString);
          localError = null;
          isLoading = false;
          console.log("WeatherWidget: Loaded weather data from fresh cache.");
          return; // Exit onMount early, no need to fetch
        } catch (e) {
          console.error("Error parsing cached weather data:", e);
          // If parsing fails, proceed to fetch new data
        }
      } else {
        console.log("WeatherWidget: Cache is stale.");
      }
    } else {
      console.log("WeatherWidget: No weather data in cache.");
    }

    // If cache is not fresh or doesn't exist, or if parsing failed, proceed with geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          fetchWeatherData(lat, lon); // Call the new function
        },
        (error) => {
          console.error("Error getting location:", error.message);
          localError = `Geolocation error: ${error.message}. Please ensure location services are enabled.`;
          localWeather = null;
          isLoading = false;
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      localError = "Geolocation is not supported by this browser.";
      localWeather = null;
      isLoading = false;
    }
  });

</script>

<div class="flex flex-col h-full text-gray-300 flex-grow">
  <h3 class="text-lg font-semibold text-purple-400 mb-3 text-center md:text-left">
    Current Weather
  </h3>

  <div class="flex-grow flex flex-col items-center justify-center">
    {#if isLoading}
      <p class="text-gray-500">Fetching your location & weather...</p>
    {:else if localError}
      <p class="text-red-400 text-sm px-2 text-center">Error: {localError}</p>
    {:else if localWeather && localWeather.temp !== undefined && localWeather.description}
      <div class="text-center">
        {#if localWeather.cityName}
          <p class="text-xl font-semibold text-purple-300">{localWeather.cityName}</p>
        {/if}
        
        {#if iconUrl}
          <img src={iconUrl} alt={localWeather.description ?? 'Weather icon'} class="mx-auto w-16 h-16 md:w-20 md:h-20" />
        {:else if localWeather?.icon}
          <p class="text-xs text-red-300">(Missing icon: {localWeather.icon})</p>
        {/if}
        
        <p class="text-3xl md:text-4xl font-bold text-white">
          {Math.round(localWeather.temp)}&deg;F
        </p>
        
        <p class="text-md capitalize text-gray-400">{localWeather.description}</p>
      </div>
    {:else}
      <p class="text-gray-500">Weather data unavailable.</p>
    {/if}
  </div>
</div>
