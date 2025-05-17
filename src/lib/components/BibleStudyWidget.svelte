<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  // --- Type Definitions ---
  type TabView = 'log' | 'graph' | 'settings';
  interface DayContribution {
    date: string;
    count: number;
    color: string;
    book?: string | null;
    chapter?: string | null;
  }
  interface Week {
    contributionDays: DayContribution[];
  }
  type ReadingLogEntry = {
    read_date: string;
    reading_book?: string | null;
    reading_chapter?: string | null;
  };
  type BibleActionData = {
    bibleSettingsError?: string;
    bibleSettingsSuccess?: boolean;
    logReadingError?: string;
    logReadingSuccess?: boolean;
  };

  // --- Props with Svelte 5 Runes ---
  let {
    initialMemoryVerse,
    initialReadingLogEntries,
    initialError,
    bibleActionData
  }: {
    initialMemoryVerse?: string | null;
    initialReadingLogEntries?: ReadingLogEntry[];
    initialError?: string | null;
    bibleActionData?: BibleActionData;
  } = $props();

  // --- Local State with Svelte 5 Runes ---
  let memoryVerseInput = $state('');
  let logBookInput = $state('');
  let logChapterInput = $state('');
  let activeTab = $state<TabView>('log');

  // --- Graph State with Svelte 5 Runes ---
  let readingGraphWeeks = $state<Week[]>([]);
  let totalReadDaysInPeriod = $state(0);

  // --- Constants ---
  const THEME_READ_COLOR = '#7E1DFB'; // Purple for read days
  const THEME_NO_READ_COLOR = '#374151'; // Tailwind's gray-700 for no-read days
  const GRAPH_SQUARE_BORDER_COLOR = 'border-gray-900/20'; // Tailwind class for subtle border
  const WEEKS_TO_DISPLAY_BIBLE_LOG = 5; // Number of weeks for the graph

  // --- Functions ---
  /**
   * Processes the raw reading log entries to generate data structured for the contribution graph.
   * @param logEntries - Array of reading log entries.
   */
  function processReadingLogForGraph(logEntries: ReadingLogEntry[] = []) {
    console.log("BibleStudyWidget (S5): processReadingLogForGraph called with entries (first 5):", JSON.stringify(logEntries.slice(0,5)));
    const today = new Date();
    today.setHours(0,0,0,0); // Normalize to start of day

    const graphStartDate = new Date(today);
    // Calculate start date: go back (WEEKS_TO_DISPLAY_BIBLE_LOG - 1) weeks, then align to Sunday.
    graphStartDate.setDate(today.getDate() - ((WEEKS_TO_DISPLAY_BIBLE_LOG - 1) * 7) - today.getDay());
    graphStartDate.setHours(0,0,0,0);

    const daysMap = new Map<string, { count: number; book?: string | null; chapter?: string | null }>();
    // Populate a map with reading data for quick lookup
    for (const entry of logEntries) {
      const entryDate = new Date(entry.read_date + 'T00:00:00'); // Parse YYYY-MM-DD as local date at midnight
      // Check if the entry date is potentially within the graph's display window
      const checkStartDate = new Date(graphStartDate);
      checkStartDate.setDate(graphStartDate.getDate() - 7); // Buffer for safety
      if (entryDate >= checkStartDate && entryDate <= today) {
        const dateString = entryDate.toISOString().split('T')[0];
        daysMap.set(dateString, { count: 1, book: entry.reading_book, chapter: entry.reading_chapter });
      }
    }

    const newWeeks: Week[] = [];
    let currentDayIterator = new Date(graphStartDate);
    let calculatedReadDaysInPeriod = 0;

    // Iterate through the weeks and days to build the graph structure
    for (let i = 0; i < WEEKS_TO_DISPLAY_BIBLE_LOG; i++) {
      const week: Week = { contributionDays: [] };
      for (let j = 0; j < 7; j++) { // 7 days a week
        const dateString = currentDayIterator.toISOString().split('T')[0];
        const logData = daysMap.get(dateString);
        
        let dayColor = THEME_NO_READ_COLOR;
        let dayCount = 0;

        if (logData) {
            dayColor = THEME_READ_COLOR;
            dayCount = 1;
            calculatedReadDaysInPeriod++;
        }
        
        week.contributionDays.push({
          date: dateString,
          count: dayCount,
          color: (currentDayIterator > today) ? 'transparent' : dayColor, // Future days are transparent
          book: logData?.book,
          chapter: logData?.chapter,
        });
        currentDayIterator.setDate(currentDayIterator.getDate() + 1);
      }
      newWeeks.push(week);
    }
    // Update $state variables, which will trigger UI updates
    readingGraphWeeks = newWeeks;
    totalReadDaysInPeriod = calculatedReadDaysInPeriod;
    console.log("BibleStudyWidget (S5): Graph processed. Displaying", readingGraphWeeks.length, "weeks. Total read in period:", totalReadDaysInPeriod);
  }

  // --- Svelte 5 Effects ---

  // Effect for initializing/updating memoryVerseInput from the initialMemoryVerse prop
  $effect(() => {
    if (initialMemoryVerse !== undefined) {
      memoryVerseInput = initialMemoryVerse || '';
    } else {
      memoryVerseInput = ''; // Default to empty if prop is null or undefined
    }
  });

  // Effect for handling results from form actions (bibleActionData prop)
  $effect(() => {
    if (bibleActionData) { // Only run if bibleActionData is defined
      if (bibleActionData.bibleSettingsSuccess) {

      }
      if (bibleActionData.logReadingSuccess) {
        logBookInput = '';    // Clear log input book field
        logChapterInput = ''; // Clear log input chapter field
        console.log("BibleStudyWidget (S5): logReadingSuccess detected from bibleActionData.");
      }
    }
  });

  $effect(() => {
    console.log("BibleStudyWidget (S5): $effect for initialReadingLogEntries triggered.");
    processReadingLogForGraph(initialReadingLogEntries || []);
  });

  onMount(() => {
    console.log("BibleStudyWidget (S5): Mounted. Initial log entries (first 5 on mount):", JSON.stringify(initialReadingLogEntries?.slice(0,5)));

  });

</script>

<div class="flex flex-col h-full">
  <div class="mb-4">
    <h3 class="text-lg font-semibold text-purple-400 text-center md:text-left">
      Bible Study Tracker
    </h3>
  </div>

  <div class="mb-4 border-b border-gray-700">
    <nav class="flex -mb-px space-x-4" aria-label="Tabs">
      <button 
        onclick={() => activeTab = 'log'} 
        class="whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none transition-colors duration-150"
        class:border-purple-500={activeTab === 'log'} class:text-purple-400={activeTab === 'log'}
        class:text-gray-500={activeTab !== 'log'} class:hover:text-gray-300={activeTab !== 'log'} 
        class:hover:border-gray-500={activeTab !== 'log'} class:border-transparent={activeTab !== 'log'}
        aria-selected={activeTab === 'log'} role="tab"
      >
        Log Reading
      </button>
      <button 
        onclick={() => activeTab = 'graph'} 
        class="whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none transition-colors duration-150"
        class:border-purple-500={activeTab === 'graph'} class:text-purple-400={activeTab === 'graph'}
        class:text-gray-500={activeTab !== 'graph'} class:hover:text-gray-300={activeTab !== 'graph'} 
        class:hover:border-gray-500={activeTab !== 'graph'} class:border-transparent={activeTab !== 'graph'}
        aria-selected={activeTab === 'graph'} role="tab"
      >
        Reading Log
      </button>
      <button 
        onclick={() => activeTab = 'settings'} 
        class="whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none transition-colors duration-150"
        class:border-purple-500={activeTab === 'settings'} class:text-purple-400={activeTab === 'settings'}
        class:text-gray-500={activeTab !== 'settings'} class:hover:text-gray-300={activeTab !== 'settings'} 
        class:hover:border-gray-500={activeTab !== 'settings'} class:border-transparent={activeTab !== 'settings'}
        aria-selected={activeTab === 'settings'} role="tab"
      >
        Settings
      </button>
    </nav>
  </div>

  {#if initialError && activeTab !== 'settings'}
    <p class="text-red-400 text-sm text-center p-2 mb-4" role="alert">{initialError}</p>
  {/if}

  <div class="flex-grow">
    {#if activeTab === 'log'}
      <div class="p-1 bg-gray-700/30 rounded-lg" role="tabpanel" aria-labelledby="tab-log">
        <h4 class="text-md font-semibold text-gray-300 mb-3 px-3 pt-3">Log Today's Reading</h4>
        <form method="POST" action="?/logBibleReading" class="space-y-3 px-3 pb-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="log-book" class="block text-sm font-medium text-gray-400">Book:</label>
              <input type="text" id="log-book" name="reading_book" bind:value={logBookInput} placeholder="e.g., John" class="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 shadow-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"/>
            </div>
            <div>
              <label for="log-chapter" class="block text-sm font-medium text-gray-400">Chapter(s):</label>
              <input type="text" id="log-chapter" name="reading_chapter" bind:value={logChapterInput} placeholder="e.g., 3 or 3-5" class="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 shadow-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"/>
            </div>
          </div>
          <button type="submit" class="w-full sm:w-auto py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 transition duration-150 ease-in-out">
            Log Reading for Today
          </button>
          {#if bibleActionData?.logReadingError}<p class="text-red-400 text-xs pt-1" role="alert">{bibleActionData.logReadingError}</p>{/if}
          {#if bibleActionData?.logReadingSuccess}<p class="text-green-400 text-xs pt-1" role="status">Reading logged for today!</p>{/if}
        </form>
      </div>

    {:else if activeTab === 'graph'}
      <div class="flex-grow p-1 bg-gray-700/30 rounded-lg" role="tabpanel" aria-labelledby="tab-graph">
        <h4 class="text-md font-semibold text-gray-300 mb-3 px-3 pt-3">My Reading Log (Last {WEEKS_TO_DISPLAY_BIBLE_LOG} Weeks)</h4>
        {#if readingGraphWeeks.length > 0}
          <div class="bg-gray-750 p-2 md:p-3 rounded-md overflow-x-auto shadow-inner mx-3 mb-3">
            <div class="flex space-x-1 min-w-max">
              {#each readingGraphWeeks as week, weekIndex (weekIndex)}
                <div class="flex flex-col space-y-1">
                  {#each week.contributionDays as day, dayIndex (day.date)}
                    <div
                      class="w-3 h-3 md:w-3.5 md:h-3.5 rounded-sm {GRAPH_SQUARE_BORDER_COLOR}"
                      style="background-color: {day.color};"
                      title="{day.count > 0 ? `${day.book || 'N/A'} ${day.chapter || ''} on ${new Date(day.date + 'T00:00:00').toLocaleDateString()}` : `No reading on ${new Date(day.date + 'T00:00:00').toLocaleDateString()}`}"
                    ></div>
                  {/each}
                </div>
              {/each}
            </div>
          </div>
          <p class="text-xs text-gray-500 text-right pr-4 pb-3">
            Total days read (last {WEEKS_TO_DISPLAY_BIBLE_LOG} weeks): {totalReadDaysInPeriod}
          </p>
        {:else}
          <p class="text-gray-500 text-sm px-3 pb-3">No readings logged in this period to display.</p>
        {/if}
      </div>

    {:else if activeTab === 'settings'}
      <div class="p-1 bg-gray-700/30 rounded-lg" role="tabpanel" aria-labelledby="tab-settings">
        <h4 class="text-md font-semibold text-gray-300 mb-3 px-3 pt-3">My Settings</h4>
        <form method="POST" action="?/saveBibleSettings" class="space-y-3 px-3 pb-3">
          <div>
            <label for="memory-verse" class="block text-sm font-medium text-gray-400">Current Memory Verse:</label>
            <input type="text" id="memory-verse" name="current_memory_verse" bind:value={memoryVerseInput} placeholder="e.g., John 3:16" class="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 shadow-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"/>
          </div>
          <button type="submit" class="w-full sm:w-auto py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 transition duration-150 ease-in-out">
            Save Settings
          </button>
          {#if bibleActionData?.bibleSettingsError}<p class="text-red-400 text-xs pt-1" role="alert">{bibleActionData.bibleSettingsError}</p>{/if}
          {#if bibleActionData?.bibleSettingsSuccess && activeTab === 'settings'}<p class="text-green-400 text-xs pt-1" role="status">Settings saved!</p>{/if}
        </form>
      </div>
    {/if}
  </div>
</div>
