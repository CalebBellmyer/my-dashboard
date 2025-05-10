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

  // This function will run when the component is first mounted to the DOM
  onMount(async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          // console.log("Latitude:", lat, "Longitude:", lon);

          try {
            // Fetch weather data from our own API endpoint, passing lat and lon
            // We will create this API endpoint in the next step.
            const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ message: response.statusText }));
              throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            localWeather = data; // Assuming the API returns data in the expected format
            localError = null;
          } catch (e: any) {
            console.error("Error fetching weather:", e);
            localError = e.message || "Failed to fetch weather data.";
            localWeather = null;
          } finally {
            isLoading = false;
          }
        },
        (error) => {
          console.error("Error getting location:", error.message);
          localError = `Geolocation error: ${error.message}. Please ensure location services are enabled.`;
          // Optionally, you could try to fetch weather for a default location here.
          // For now, we'll just show the error.
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
