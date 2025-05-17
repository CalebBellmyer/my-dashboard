// src/+layout.server.ts
// --- Imports ---
import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types"


// --- Load Function ---
// Define and export the 'load' function for the root layout
export const load: LayoutServerLoad = async ({ locals: { getSession }, url }) => {

  let user = null;
  try {
    user = await getSession();
  } catch (error) {
    console.error("Error fetching session in layout load.", error)
    redirect(303, '/auth')
  }


  // 2. Check if the user is trying to access a protected route (e.g., the dashboard root '/')
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