<script lang="ts">
  // Import the $page store to access page data, including the user session
  import { page } from '$app/stores';
  import WidgetCard from '$lib/components/WidgetCard.svelte';
  import WeatherWidget from '$lib/components/WeatherWidget.svelte';

  $: user = $page.data.user;


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
        <p>Loading GitHub...</p>
    </WidgetCard>

    <WidgetCard >
        <p>Loading Megamillions info...</p>
    </WidgetCard>

    <WidgetCard >
        <p>Reading tracker and notes...</p>
    </WidgetCard>

      </div>
  </main>

</div>

