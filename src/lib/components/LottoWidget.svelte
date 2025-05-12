<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  interface LottoData {
    nextJackpotAnnuity?: number;
    nextJackpotCash?: number;
    nextDrawingDate?: string; // Expecting a date string parsable by new Date()
  }

  // Local state
  let lottoInfo: LottoData | null = null;
  let error: string | null = null;
  let isLoading: boolean = true;

  // Countdown state
  let days: string | number = '00';
  let hours: string | number = '00';
  let minutes: string | number = '00';
  let seconds: string | number = '00';
  let countdownInterval: any; 

  // --- Caching Constants ---
  const CACHE_KEY_LOTTO_DATA = 'cachedLottoData';
  const CACHE_KEY_LOTTO_TIMESTAMP = 'cachedLottoTimestamp';
  

  function formatNumber(num: number | undefined): string {
    if (num === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  }

  function startCountdown(targetDateString: string | undefined) {
    if (!targetDateString) {
      days = hours = minutes = seconds = '--';
      return;
    }

    const targetDate = new Date(targetDateString).getTime();

    if (isNaN(targetDate)) {
      console.error("LottoWidget: Invalid target date for countdown:", targetDateString);
      days = hours = minutes = seconds = '!!'; // Indicate error
      error = "Invalid drawing date format for countdown."
      return;
    }
    
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }

    countdownInterval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(countdownInterval);
        days = '00';
        hours = '00';
        minutes = '00';
        seconds = '00';
        fetchLottoInfo(true); // Force fetch
        return;
      }

      days = Math.floor(distance / (1000 * 60 * 60 * 24)).toString().padStart(2, '0');
      hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
      minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
      seconds = Math.floor((distance % (1000 * 60)) / 1000).toString().padStart(2, '0');
    }, 1000);
  }

  async function fetchLottoInfo(forceFetch: boolean = false) {
    isLoading = true;
    error = null;

    if (!forceFetch) {
      const cachedDataString = localStorage.getItem(CACHE_KEY_LOTTO_DATA);
      const cachedTimestampString = localStorage.getItem(CACHE_KEY_LOTTO_TIMESTAMP);

      if (cachedDataString && cachedTimestampString) {
        const cachedTimestamp = parseInt(cachedTimestampString, 10);
        
        const cachedDate = new Date(cachedTimestamp);
        const currentDate = new Date();

        // Set both dates to the beginning of their respective days for comparison
        cachedDate.setHours(0, 0, 0, 0);
        currentDate.setHours(0, 0, 0, 0);

        if (currentDate.getTime() <= cachedDate.getTime()) { // Cache is from today
          try {
            lottoInfo = JSON.parse(cachedDataString);
            startCountdown(lottoInfo?.nextDrawingDate);
            isLoading = false;
            console.log("LottoWidget: Loaded lotto data from fresh cache (same day).");
            return;
          } catch (e) {
            console.error("Error parsing cached lotto data:", e);
          }
        } else {
          console.log("LottoWidget: Lotto cache is stale (from a previous day).");
        }
      } else {
        console.log("LottoWidget: No lotto data in cache.");
      }
    }

    try {
      const response = await fetch('/api/lotto-info');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data: LottoData = await response.json();
      lottoInfo = data;
      startCountdown(lottoInfo?.nextDrawingDate);

      // Save to cache
      localStorage.setItem(CACHE_KEY_LOTTO_DATA, JSON.stringify(data));
      localStorage.setItem(CACHE_KEY_LOTTO_TIMESTAMP, Date.now().toString()); // Save current timestamp
      console.log("LottoWidget: Fetched new lotto data and cached it.");

    } catch (e: any) {
      console.error("Error fetching lotto info:", e);
      error = e.message || "Failed to fetch lotto data.";
      lottoInfo = null; // Clear lotto data on error
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    fetchLottoInfo();
  });

  onDestroy(() => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
  });

</script>

<div class="flex flex-col h-full text-gray-300">
  <h3 class="text-lg font-semibold text-purple-400 mb-3 text-center md:text-left">
    Mega Millions
  </h3>

  <div class="flex-grow flex flex-col items-center justify-center p-2 space-y-3">
    {#if isLoading}
      <p class="text-gray-500">Loading Jackpot Info...</p>
    {:else if error}
      <p class="text-red-400 text-sm text-center">Error: {error}</p>
    {:else if lottoInfo}
      <div class="text-center w-full">
        <div class="mb-2">
          <p class="text-sm text-gray-400">Estimated Jackpot</p>
          <p class="text-3xl md:text-4xl font-bold text-white">
            {formatNumber(lottoInfo.nextJackpotAnnuity)}
          </p>
        </div>
        <div class="mb-4">
          <p class="text-xs text-gray-500">Est. Cash Value: {formatNumber(lottoInfo.nextJackpotCash)}</p>
        </div>

        <div class="mt-2">
          <p class="text-sm text-gray-400 mb-1">Next Drawing In:</p>
          <div class="flex justify-center space-x-2 text-xl md:text-2xl font-mono bg-gray-700/50 p-2 rounded-md max-w-xs mx-auto">
            <div><span class="font-bold text-purple-300">{days}</span><span class="text-xs text-gray-500">d</span></div>
            <div><span class="font-bold text-purple-300">{hours}</span><span class="text-xs text-gray-500">h</span></div>
            <div><span class="font-bold text-purple-300">{minutes}</span><span class="text-xs text-gray-500">m</span></div>
            <div><span class="font-bold text-purple-300">{seconds}</span><span class="text-xs text-gray-500">s</span></div>
          </div>
        </div>
      </div>
    {:else}
      <p class="text-gray-500">Lotto data unavailable.</p>
    {/if}
  </div>
</div>
