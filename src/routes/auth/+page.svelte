<script lang="ts">
  import type { ActionData } from './$types';

  let { form }: { form?: ActionData } = $props();  

  let currentView = $state<'login' | 'signup'>('login');
  let emailInput = $state('');
  let passwordInput = $state('');

  $effect(() => {
    if (form && 'email' in form && typeof form.email  === 'string') {
      emailInput = form.email;
    }
  })

  // Function to switch the view
  function setView(view: 'login' | 'signup') {
    currentView = view;
    // Clear previous form action results when switching views
    form = undefined;
    emailInput = '';
    passwordInput = '';
  }

</script>

<div class="flex items-center justify-center min-h-screen bg-gray-900 text-gray-200 font-sans perspective p-4"> 

  <div
    class="w-full max-w-md relative transition-transform duration-700 ease-in-out transform-style-3d bg-gray-800 rounded-lg shadow-xl min-h-[600px]"
    class:rotate-y-180={currentView === 'signup'}
  >
    <div class="absolute w-full h-full backface-hidden p-8 flex flex-col justify-between"> 
      <div>
        <h1 class="text-3xl font-bold text-center text-white mb-6">Welcome</h1>
        <div class="space-y-4">
          <h2 class="text-xl font-semibold text-center text-gray-300">Login</h2>
          <form method="POST" action="?/login" class="space-y-4">
            <div>
              <label for="login-email" class="block text-sm font-medium text-gray-400">Email</label>
              <input
                type="email"
                id="login-email"
                name="email"
                required
                placeholder="you@example.com"
                class="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                bind:value={emailInput}
              />
            </div>
            <div>
              <label for="login-password" class="block text-sm font-medium text-gray-400">Password</label>
              <input
                type="password"
                id="login-password"
                name="password"
                required
                placeholder="••••••••"
                class="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                bind:value={passwordInput}
              />
            </div>
            <div>
              <button
                type="submit"
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 transition duration-150 ease-in-out"
              >
                Login
              </button>
            </div>
          </form>
          <div class="text-center mt-4">
            <button
              type="button"
              onclick={() => setView('signup')}
              class="text-sm text-purple-400 hover:text-purple-300 hover:underline focus:outline-none focus:underline"
            >
              Need an account? Sign Up
            </button>
          </div>
        </div>
      </div>
       <div class="text-center text-sm h-4 mt-auto pt-4">
        {#if form && currentView === 'login' && 'error' in form && form.error}
          <p class="text-red-400" role="alert">{form.error}</p>
        {/if}
        </div>
    </div>

    <div class="absolute w-full h-full backface-hidden p-8 flex flex-col justify-between rotate-y-180">
       <div> 
         <h1 class="text-3xl font-bold text-center text-white mb-6">Welcome</h1>
         <div class="space-y-4">
          <h2 class="text-xl font-semibold text-center text-gray-300">Sign Up</h2>
          <form method="POST" action="?/signup" class="space-y-4">
            <div>
              <label for="signup-email" class="block text-sm font-medium text-gray-400">Email</label>
              <input
                type="email"
                id="signup-email"
                name="email"
                required
                placeholder="you@example.com"
                class="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                bind:value={emailInput}
              />
            </div>
            <div>
              <label for="signup-password" class="block text-sm font-medium text-gray-400">Password</label>
              <input
                type="password"
                id="signup-password"
                name="password"
                required
                placeholder="Min. 8 chars, 1 upper, 1 lower, 1 digit, 1 special"
                class="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                bind:value={passwordInput}
              />
            </div>
            <div>
              <button
                type="submit"
                class="w-full flex justify-center py-2 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-purple-500 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 transition duration-150 ease-in-out"
              >
                Sign Up
              </button>
            </div>
          </form>
           <div class="text-center mt-4">
            <button
              type="button"
              onclick={() => setView('login')}
              class="text-sm text-purple-400 hover:text-purple-300 hover:underline focus:outline-none focus:underline"
            >
              Already have an account? Login
            </button>
          </div>
        </div>
       </div>
       <div class="text-center text-sm h-4 mt-auto pt-4">
        {#if form && currentView === 'signup' && 'error' in form && form.error}
          <p class="text-red-400" role="alert">{form.error}</p>
        {/if}
        {#if form && currentView === 'signup' && 'message' in form && form.message}
          <p class="text-green-400" role="status">{form.message}</p>
        {/if}
      </div>
    </div>

  </div>
</div>

<style>
  .perspective {
    perspective: 1000px; /* Creates the 3D space */
  }
  .transform-style-3d {
    transform-style: preserve-3d; /* Allows children to exist in 3D space */
  }
  .backface-hidden {
    backface-visibility: hidden; /* Hides the back side of elements when flipped */
    -webkit-backface-visibility: hidden; /* Safari prefix */
  }
  .rotate-y-180 {
    transform: rotateY(180deg); /* The rotation applied to flip */
  }
</style>
