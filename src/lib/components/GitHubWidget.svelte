<script lang="ts">
  import { onMount } from 'svelte';

  // Hardcoded GitHub username
  const GITHUB_USERNAME_TO_FETCH = "CalebBellmyer"; // Or your actual username
  const WEEKS_TO_DISPLAY = 4; // Display roughly the last month (5 weeks)

  // Local state for the widget
  let rawContributionData: {
    totalContributions?: number;
    weeks?: { contributionDays: { contributionCount: number; date: string; color: string }[] }[];
  } | null = null;
  let contributionError: string | null = null;
  let isLoadingContributions: boolean = true;

  // Reactive variables for displayed data
  let displayWeeks: { contributionDays: { contributionCount: number; date: string; color: string }[] }[] = [];
  let displayedTotalContributions: number = 0;

  // --- Color Mapping Function ---
  function mapGitHubColorToTheme(githubColor: string): string {
    // Ensure githubColor is lowercase for consistent matching
    const lowerColor = githubColor.toLowerCase();
    switch (lowerColor) {
      case '#ebedf0': // Default GitHub no/low contribution color (light gray)
        return '#374151'; // Tailwind's gray-700 (adjust if needed for contrast with graph bg)
      case '#9be9a8': // Lightest green
        return '#A78BFA'; // A lighter purple (Tailwind's purple-400)
      case '#40c463': // Medium green
        return '#8B5CF6'; // A medium purple (Tailwind's purple-500)
      case '#30a14e': // Darker green
        return '#7E1DFB'; // Your main accent purple!
      case '#216e39': // Darkest green
        return '#6D28D9'; // A darker purple (Tailwind's purple-700)
      default:
        // Fallback to the original color if it's somehow not one of the expected ones
        // Or return a default theme color, e.g., a base gray for unexpected values
        console.warn("Unknown GitHub color received:", githubColor);
        return githubColor; // Or return '#374151' (gray-700) as a safe default
    }
  }

  async function fetchContributions(username: string) {
    if (!username) {
      contributionError = "GitHub username is not set.";
      isLoadingContributions = false;
      return;
    }
    
    isLoadingContributions = true;
    contributionError = null;
    rawContributionData = null; 

    try {
      const response = await fetch(`/api/github-contributions?username=${encodeURIComponent(username)}`);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errData.message || `Error ${response.status}`);
      }
      rawContributionData = await response.json(); 
      
      if (!rawContributionData?.weeks) {
        contributionError = "Contribution data format is unexpected.";
        rawContributionData = null; 
      }
    } catch (e: any) {
      contributionError = e.message || "Could not load contribution data.";
    } finally {
      isLoadingContributions = false;
    }
  }

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
    } else {
      displayWeeks = [];
      displayedTotalContributions = 0;
    }
  }

  onMount(() => {
    fetchContributions(GITHUB_USERNAME_TO_FETCH);
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
      {#if rawContributionData && !rawContributionData.weeks}
        <p class="text-xs text-yellow-400">(Received data, but 'weeks' array is missing or empty)</p>
      {/if}
    {/if}
  </div>
</div>
