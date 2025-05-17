// src/+page.svelte 

<script lang="ts">
  // Import the $page store to access page data, including the user session
  import { page } from '$app/stores';
  import WidgetCard from '$lib/components/WidgetCard.svelte';
  import WeatherWidget from '$lib/components/WeatherWidget.svelte';
  import GitHubWidget from '$lib/components/GitHubWidget.svelte';
  import LottoWidget from '$lib/components/LottoWidget.svelte';
	import BibleTrackerWidget from '$lib/components/BibleTrackerWidget.svelte';

  $: user = $page.data.user;
  export let data;
  export let form;

</script>

<div class="min-h-screen bg-gray-900 text-gray-200 p-4 md:p-8 font-sans">

  <header class="mb-8 flex justify-center">
      <h1 class="text-2xl md:text-3xl font-bold text-white ">
        Welcome back, <span class="text-purple-400">{user.email}</span>!
      </h1>
    </header>

  <main>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">

    <WidgetCard>
        <WeatherWidget />
    </WidgetCard>

    <WidgetCard >
        <GitHubWidget />
    </WidgetCard>

    <WidgetCard >
        <LottoWidget />
    </WidgetCard>

    <WidgetCard >
        <BibleTrackerWidget 
        bibleStudy={data?.bibleStudy}
        formActionData={form}/>
    </WidgetCard>

      </div>
  </main>

</div>

