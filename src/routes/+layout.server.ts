// --- Imports ---
import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types"


// --- Load Function ---
// Define and export the 'load' function for the root layout
export const load: LayoutServerLoad = async ({ locals: { getSession, supabase }, url }) => {

  const user = await getSession();
  console.log('--- Layout Load ---');
  console.log('Pathname:', url.pathname);
  console.log('User object:', user);

  // 2. Check if the user is trying to access a protected route (e.g., the dashboard root '/')
  //    while *not* being logged in.
  if (!user && url.pathname !== '/auth') { 
     redirect(303, '/auth');
  }

  
  if (user && url.pathname === '/auth') {
     redirect(303, '/');
  }

  return {
    user,

  };

};