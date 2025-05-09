<script lang="ts">
  import { onMount } from 'svelte'; // Import onMount for logging

  // Define the expected shape of the weather data prop
  export let weather: {
    temp?: number;
    description?: string;
    icon?: string;
    cityName?: string; // Optional: if you decide to pass city name from API
  } | null = null;

  // Define a prop for potential error messages
  export let error: string | null = null;

  // Base URL for OpenWeatherMap icons
  const iconBaseUrl = "https://openweathermap.org/img/wn/";

  // Reactive statement to construct the full icon URL if an icon code is available
  // The @2x.png suffix gets a larger version of the icon.
  $: iconUrl = weather?.icon ? `${iconBaseUrl}${weather.icon}@2x.png` : null;

  // Log the weather data and iconUrl when the weather prop changes
  $: {
    if (weather) {
      // console.log("WeatherWidget received weather data:", weather);
      // console.log("WeatherWidget generated iconUrl:", iconUrl);
    }
    if (error) {
      // console.log("WeatherWidget received error:", error);
    }
  }

</script>

<div class="flex flex-col h-full text-gray-300 flex-grow">
  <h3 class="text-lg font-semibold text-purple-400 mb-3 text-center md:text-left">
    Weather
  </h3>

  <div class="flex-grow flex flex-col items-center justify-center">
    {#if error}
      <p class="text-red-400 text-sm">Error: {error}</p>
    {:else if weather && weather.temp !== undefined && weather.description}
      <div class="text-center">
        {#if weather.cityName}
          <p class="text-xl font-semibold text-purple-300">{weather.cityName}</p>
        {/if}
        
        {#if iconUrl}
          <img src={iconUrl} alt={weather.description ?? 'Weather icon'} class="mx-auto w-16 h-16 md:w-20 md:h-20" />
        {:else if weather?.icon}
          <p class="text-xs text-red-300">(Missing icon: {weather.icon})</p>
        {/if}
        
        <p class="text-3xl md:text-4xl font-bold text-white">
          {Math.round(weather.temp)}&deg;F
        </p>
        
        <p class="text-md capitalize text-gray-400">{weather.description}</p>
      </div>
    {:else}
      <p class="text-gray-500">Loading weather data...</p>
    {/if}
  </div>
</div>
