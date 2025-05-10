<script lang="ts">
  import { onMount } from 'svelte';

  // Hardcoded GitHub username
  const GITHUB_USERNAME_TO_FETCH = "CalebBellmyer"; // Or your actual username
  const WEEKS_TO_DISPLAY = 5; 

  // --- Caching Constants ---
  // Make keys specific to the user being fetched to avoid conflicts if username changes
  const CACHE_KEY_GITHUB_DATA_PREFIX = 'cachedGitHubData_';
  const CACHE_KEY_GITHUB_TIMESTAMP_PREFIX = 'cachedGitHubTimestamp_';
  const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  // Local state for the widget
  let rawContributionData: {
    totalContributions?: number;
    weeks?: { contributionDays: { contributionCount: number; date: string; color: string }[] }[];
  } | null = null;
  let contributionError: string | null = null;
  let isLoadingContributions: boolean = true;

  let displayWeeks: { contributionDays: { contributionCount: number; date: string; color: string }[] }[] = [];
  let displayedTotalContributions: number = 0;

  function mapGitHubColorToTheme(githubColor: string): string {
    const lowerColor = githubColor.toLowerCase();
    switch (lowerColor) {
      case '#ebedf0': return '#374151'; // gray-700
      case '#9be9a8': return '#A78BFA'; // purple-400
      case '#40c463': return '#8B5CF6'; // purple-500
      case '#30a14e': return '#7E1DFB'; // accent purple
      case '#216e39': return '#6D28D9'; // purple-700
      default:
        console.warn("Unknown GitHub color received:", githubColor);
        return githubColor;
    }
  }

  async function fetchAndProcessContributions(username: string) {
    if (!username) {
      contributionError = "GitHub username is not set.";
      isLoadingContributions = false;
      return;
    }
    
    isLoadingContributions = true;
    contributionError = null;
    rawContributionData = null;

    // --- Check Cache ---
    const cacheKeyData = `${CACHE_KEY_GITHUB_DATA_PREFIX}${username}`;
    const cacheKeyTimestamp = `${CACHE_KEY_GITHUB_TIMESTAMP_PREFIX}${username}`;
    const cachedDataString = localStorage.getItem(cacheKeyData);
    const cachedTimestampString = localStorage.getItem(cacheKeyTimestamp);

    if (cachedDataString && cachedTimestampString) {
      const cachedTimestamp = parseInt(cachedTimestampString, 10);
      const now = Date.now();
      if (now - cachedTimestamp < CACHE_DURATION_MS) {
        try {
          rawContributionData = JSON.parse(cachedDataString);
          console.log(`GitHubWidget: Loaded contributions for ${username} from fresh cache.`);
          // Processing of rawContributionData into displayWeeks will happen via the reactive block
          isLoadingContributions = false; // Already set data, stop loading
          return; // Exit early
        } catch (e) {
          console.error("Error parsing cached GitHub data:", e);
          // If parsing fails, proceed to fetch new data
        }
      } else {
        console.log(`GitHubWidget: Cache for ${username} is stale.`);
      }
    } else {
      console.log(`GitHubWidget: No cache found for ${username}.`);
    }

    // --- Fetch New Data ---
    console.log("GitHubWidget: Fetching new contributions for username:", username);
    try {
      const response = await fetch(`/api/github-contributions?username=${encodeURIComponent(username)}`);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errData.message || `Error ${response.status}`);
      }
      const newData = await response.json(); 
      rawContributionData = newData; // Set raw data, reactive block will process it
      
      if (!rawContributionData?.weeks) {
        console.warn("GitHubWidget: Contribution data is missing 'weeks'. Full response:", rawContributionData);
        contributionError = "Contribution data format is unexpected.";
        rawContributionData = null; 
      } else {
        // Save to cache if data is valid
        localStorage.setItem(cacheKeyData, JSON.stringify(newData));
        localStorage.setItem(cacheKeyTimestamp, Date.now().toString());
        console.log(`GitHubWidget: Fetched new data for ${username} and cached it.`);
      }
    } catch (e: any) {
      console.error("GitHubWidget: Failed to fetch GitHub contributions for", username, e);
      contributionError = e.message || "Could not load contribution data.";
    } finally {
      isLoadingContributions = false;
    }
  }

  // Reactive block to process rawContributionData into displayWeeks and displayedTotalContributions
  $: {
    if (rawContributionData?.weeks && rawContributionData.weeks.length > 0) {
      const allWeeks = rawContributionData.weeks;
      displayWeeks = allWeeks.slice(Math.max(0, allWeeks.length - WEEKS_TO_DISPLAY));
      
      let sum = 0;
      for (const week of displayWeeks) {
        for (const day of week.contributionDays) {
          sum += day.contributionCount;
        }
      }
      displayedTotalContributions = sum;
    } else if (!isLoadingContributions && rawContributionData) { // Handle case where data is fetched but empty/invalid
        displayWeeks = [];
        displayedTotalContributions = 0;
        // contributionError might already be set if format was unexpected
    } else if (!isLoadingContributions && !rawContributionData && !contributionError) {
        // This case might indicate no data found but not an explicit fetch error
        displayWeeks = [];
        displayedTotalContributions = 0;
    }
  }

  onMount(() => {
    fetchAndProcessContributions(GITHUB_USERNAME_TO_FETCH);
  });

</script>

<div class="flex flex-col h-full">
  <h3 class="text-lg font-semibold text-purple-400 mb-3 text-center md:text-left">
    GitHub Activity <span class="text-xs text-gray-500">({GITHUB_USERNAME_TO_FETCH} - Last {WEEKS_TO_DISPLAY} Weeks)</span>
  </h3>

  <div class="flex-grow flex flex-col items-center justify-center p-1 md:p-2">
    {#if isLoadingContributions}
      <p class="text-gray-500">Loading contributions for {GITHUB_USERNAME_TO_FETCH}...</p>
    {:else if contributionError}
      <p class="text-red-400 text-sm text-center">{contributionError}</p>
    {:else if displayWeeks && displayWeeks.length > 0}
      <div class="w-full">
        <div class="bg-gray-750 p-3 rounded-md overflow-y-auto shadow-inner max-h-[200px]">
          <div class="flex flex-col space-y-1 min-h-max"> 
            {#each displayWeeks as week}
              <div class="flex space-x-1">
                {#each week.contributionDays as day}
                  <div
                    class="w-3 h-3 md:w-3.5 md:h-3.5 rounded-sm border border-gray-900/20"
                    style="background-color: {mapGitHubColorToTheme(day.color)};"
                    title="{day.contributionCount} contributions on {new Date(day.date).toLocaleDateString()}"
                  ></div>
                {/each}
              </div>
            {/each}
          </div>
        </div>
        <p class="text-xs text-gray-500 mt-2 text-right pr-1">
          Total contributions (last {WEEKS_TO_DISPLAY} weeks): {displayedTotalContributions}
        </p>
      </div>
    {:else}
      <p class="text-gray-400">No contribution data to display for {GITHUB_USERNAME_TO_FETCH}.</p>
      {#if rawContributionData && (!rawContributionData.weeks || rawContributionData.weeks.length === 0) && !isLoadingContributions && !contributionError}
        <p class="text-xs text-yellow-400">(No activity in the selected period or data format issue)</p>
      {/if}
    {/if}
  </div>
</div>
