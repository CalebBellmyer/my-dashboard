<script lang="ts">
  import { onMount } from 'svelte'; // onMount for initial setup if needed

  // Props from +page.svelte
  // 'bibleStudy' contains data from the load function in +page.server.ts
  export let bibleStudy: {
    currentMemoryVerse?: string | null;
    readingLogEntries?: { read_date: string; reading_book?: string | null; reading_chapter?: string | null }[];
    error?: string | null;
  } | undefined = undefined;

  // 'formActionData' receives the 'form' prop from +page.svelte,
  // which holds results from SvelteKit form actions.
  export let formActionData: {
    memoryVerseError?: string;
    memoryVerseSaveSuccess?: boolean;
    logReadingError?: string;
    logReadingSuccess?: boolean;
    // Add other potential action results here if needed
  } | undefined = undefined;

  // --- Local State for Inputs ---
  let memoryVerseInput: string = '';
  let logBookInput: string = '';
  let logChapterInput: string = '';

  // --- State for Active Tab ---
  type TabView = 'log' | 'graph' | 'settings';
  let activeTab: TabView = 'log'; // Default tab

  // --- State for the Reading Log Graph ---
  interface DayContribution { date: string; count: number; color: string; book?: string | null; chapter?: string | null; }
  interface Week { contributionDays: DayContribution[]; }
  let readingGraphWeeks: Week[] = [];
  let totalReadDaysInPeriod: number = 0;

  const THEME_READ_COLOR = '#7E1DFB'; // Your main accent purple
  const THEME_NO_READ_COLOR = '#374151'; // e.g., Tailwind's gray-700
  const GRAPH_SQUARE_BORDER_COLOR = 'border-gray-900/20'; // Subtle border for squares
  const WEEKS_TO_DISPLAY_BIBLE_LOG = 5;

  // --- Functions ---
  function processReadingLogForGraph(
    logEntries: { read_date: string; reading_book?: string | null; reading_chapter?: string | null }[] = []
  ) {
    // console.log("BibleStudyWidget: processReadingLogForGraph CALLED with entries (count):", logEntries.length);
    const today = new Date();
    today.setHours(0,0,0,0); // Normalize to start of day for accurate comparisons

    const graphStartDate = new Date(today);
    // Calculate start date to show WEEKS_TO_DISPLAY_BIBLE_LOG full weeks, ending with the current week.
    graphStartDate.setDate(today.getDate() - ((WEEKS_TO_DISPLAY_BIBLE_LOG - 1) * 7) - today.getDay());
    graphStartDate.setHours(0,0,0,0);

    const daysMap = new Map<string, { count: number; book?: string | null; chapter?: string | null }>();
    for (const entry of logEntries) {
      // Ensure date from DB (YYYY-MM-DD) is parsed as local date at midnight
      const entryDate = new Date(entry.read_date + 'T00:00:00');
      if (entryDate >= graphStartDate && entryDate <= today) {
          const dateString = entryDate.toISOString().split('T')[0];
          daysMap.set(dateString, { count: 1, book: entry.reading_book, chapter: entry.reading_chapter });
      }
    }

    const newWeeks: Week[] = [];
    let currentDayIterator = new Date(graphStartDate);
    let calculatedReadDaysInPeriod = 0;

    for (let i = 0; i < WEEKS_TO_DISPLAY_BIBLE_LOG; i++) {
      const week: Week = { contributionDays: [] };
      let weekHasRelevantDays = false;
      for (let j = 0; j < 7; j++) { // 7 days a week
        const dateString = currentDayIterator.toISOString().split('T')[0];
        const logData = daysMap.get(dateString);
        let dayColor = THEME_NO_READ_COLOR;
        let dayCount = 0;

        if (logData) { dayColor = THEME_READ_COLOR; dayCount = 1; }
        
        if (currentDayIterator <= today) {
            week.contributionDays.push({ date: dateString, count: dayCount, color: dayColor, book: logData?.book, chapter: logData?.chapter });
            if (dayCount > 0) { calculatedReadDaysInPeriod++; }
            weekHasRelevantDays = true;
        } else {
             week.contributionDays.push({ date: dateString, count: 0, color: 'transparent'}); // Future days
        }
        currentDayIterator.setDate(currentDayIterator.getDate() + 1);
      }
      // Only add week if it has relevant days or to maintain structure up to today
      if(weekHasRelevantDays || (week.contributionDays.length > 0 && new Date(week.contributionDays[0].date) <= today)) { 
        newWeeks.push(week); 
      }
    }
    readingGraphWeeks = newWeeks;
    totalReadDaysInPeriod = calculatedReadDaysInPeriod;
    // console.log("BibleStudyWidget: Graph PROCESSED. Weeks displayed:", readingGraphWeeks.length, "Total read in period:", totalReadDaysInPeriod);
  }

  // --- Reactive Updates ---
  // Initialize and update memoryVerseInput when the prop changes
  $: memoryVerseInput = bibleStudy?.currentMemoryVerse || '';

  // Clear log inputs after successful logging action
  $: if (formActionData?.logReadingSuccess) {
    logBookInput = '';
    logChapterInput = '';
    // The graph will update automatically because the `bibleStudy.readingLogEntries` prop 
    // will change after SvelteKit re-runs the page's load function.
  }

  // Process graph data when readingLogEntries prop changes
  // This is the primary way the graph updates.
  $: {
    // console.log("BibleStudyWidget: Reactive block for bibleStudy.readingLogEntries TRIGGERED. Entries (first 5):", JSON.stringify(bibleStudy?.readingLogEntries?.slice(0,5)));
    processReadingLogForGraph(bibleStudy?.readingLogEntries || []);
  }
  
  // Initialize inputs and graph on mount (if data is already available from props)
  onMount(() => {
    memoryVerseInput = bibleStudy?.currentMemoryVerse || '';
    processReadingLogForGraph(bibleStudy?.readingLogEntries || []);
    // console.log("BibleStudyWidget: MOUNTED. Initial readingLogEntries:", bibleStudy?.readingLogEntries?.length);
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
      <button on:click={() => activeTab = 'log'} class="whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none transition-colors duration-150" class:border-purple-500={activeTab === 'log'} class:text-purple-400={activeTab === 'log'} class:text-gray-500={activeTab !== 'log'} class:hover:text-gray-300={activeTab !== 'log'} class:hover:border-gray-500={activeTab !== 'log'} class:border-transparent={activeTab !== 'log'}>Log Reading</button>
      <button on:click={() => activeTab = 'graph'} class="whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none transition-colors duration-150" class:border-purple-500={activeTab === 'graph'} class:text-purple-400={activeTab === 'graph'} class:text-gray-500={activeTab !== 'graph'} class:hover:text-gray-300={activeTab !== 'graph'} class:hover:border-gray-500={activeTab !== 'graph'} class:border-transparent={activeTab !== 'graph'}>Activity Log</button>
      <button on:click={() => activeTab = 'settings'} class="whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none transition-colors duration-150" class:border-purple-500={activeTab === 'settings'} class:text-purple-400={activeTab === 'settings'} class:text-gray-500={activeTab !== 'settings'} class:hover:text-gray-300={activeTab !== 'settings'} class:hover:border-gray-500={activeTab !== 'settings'} class:border-transparent={activeTab !== 'settings'}>Settings</button>
    </nav>
  </div>

  {#if bibleStudy?.error && activeTab !== 'settings'}
    <p class="text-red-400 text-sm text-center p-2 mb-4">{bibleStudy.error}</p>
  {/if}

  <div class="flex-grow">
    {#if activeTab === 'log'}
      <div class="p-1 bg-gray-700/30 rounded-lg">
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
          {#if formActionData?.logReadingError}<p class="text-red-400 text-xs pt-1">{formActionData.logReadingError}</p>{/if}
          {#if formActionData?.logReadingSuccess}<p class="text-green-400 text-xs pt-1">Reading logged for today!</p>{/if}
        </form>
      </div>

    {:else if activeTab === 'graph'}
      <div class="flex-grow p-1 bg-gray-700/30 rounded-lg">
        <h4 class="text-md font-semibold text-gray-300 mb-3 px-3 pt-3">My Reading Log (Last {WEEKS_TO_DISPLAY_BIBLE_LOG} Weeks)</h4>
        {#if readingGraphWeeks.length > 0}
          <div class="bg-gray-750 p-2 md:p-3 rounded-md overflow-x-auto shadow-inner mx-3 mb-3">
            <div class="flex flex-col space-y-1 min-h-max"> 
              {#each readingGraphWeeks as week, weekIndex (weekIndex)}
                <div class="flex space-x-1"> 
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
      <div class="p-1 bg-gray-700/30 rounded-lg">
        <h4 class="text-md font-semibold text-gray-300 mb-3 px-3 pt-3">My Settings</h4>
        <form method="POST" action="?/saveMemoryVerse" class="space-y-3 px-3 pb-3">
          <div>
            <label for="memory-verse" class="block text-sm font-medium text-gray-400">Current Memory Verse:</label>
            <input type="text" id="memory-verse" name="current_memory_verse" bind:value={memoryVerseInput} placeholder="e.g., John 3:16" class="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 shadow-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"/>
          </div>
          <button type="submit" class="w-full sm:w-auto py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 transition duration-150 ease-in-out">
            Save Memory Verse
          </button>
          {#if formActionData?.memoryVerseError}<p class="text-red-400 text-xs pt-1">{formActionData.memoryVerseError}</p>{/if}
          {#if formActionData?.memoryVerseSaveSuccess && activeTab === 'settings'}<p class="text-green-400 text-xs pt-1">Memory verse saved!</p>{/if}
        </form>
      </div>
    {/if}
  </div>
</div>
