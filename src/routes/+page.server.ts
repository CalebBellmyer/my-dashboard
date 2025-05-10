// src/routes/+page.server.ts

import { fail } from '@sveltejs/kit'; // Import fail for form actions
import type { PageServerLoad, Actions } from './$types'; // Import Actions type

export const load: PageServerLoad = async ({ locals: { supabase, getSession } }) => {
  const user = await getSession();

  let githubUsername: string | null = null;
  let githubUsernameError: string | null = null;

  if (user) {
    try {
      const { data: userSettings, error: dbError } = await supabase
        .from('user_settings')
        .select('github_username')
        .eq('user_id', user.id)
        .single();

      if (dbError && dbError.code !== 'PGRST116') {
        console.error('Error fetching GitHub username from Supabase:', dbError);
        githubUsernameError = 'Could not retrieve your GitHub username settings.';
      } else if (userSettings) {
        githubUsername = userSettings.github_username;
      }
    } catch (e: any) {
      console.error('Exception fetching GitHub username:', e);
      githubUsernameError = 'An error occurred while fetching your GitHub username settings.';
    }
  } else {
    githubUsernameError = 'User not authenticated.';
  }

  console.log("Page load function is returning githubUsername:", githubUsername);

  return {
    githubUsername: githubUsername,
    githubUsernameError: githubUsernameError,
  };
};

// Add Actions for form submissions on this page
export const actions: Actions = {
  // Action to save/update the user's GitHub username
  saveGithubUsername: async ({ request, locals: { supabase, getSession } }) => {
    const user = await getSession();
    if (!user) {
      return fail(401, { githubUsernameSaveError: 'You must be logged in to save settings.' });
    }

    const formData = await request.formData();
    const newGithubUsername = formData.get('github_username');

    if (typeof newGithubUsername !== 'string' || !newGithubUsername.trim()) {
      return fail(400, { githubUsernameSaveError: 'GitHub username cannot be empty.' });
    }

    // Validate username format (simple check, GitHub has stricter rules)
    if (!/^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/.test(newGithubUsername)) {
        return fail(400, { githubUsernameSaveError: 'Invalid GitHub username format.', enteredUsername: newGithubUsername });
    }


    try {
      // Upsert the username: inserts if no row exists for user_id, updates if it does.
      const { error: upsertError } = await supabase
        .from('user_settings')
        .upsert({ user_id: user.id, github_username: newGithubUsername.trim() }, { onConflict: 'user_id' });

      if (upsertError) {
        console.error('Error saving GitHub username to Supabase:', upsertError);
        return fail(500, { githubUsernameSaveError: 'Failed to save GitHub username.' });
      }

      // Important: After a successful action, SvelteKit will re-run the 'load' function for the page.
      // This means the 'githubUsername' prop passed to the page will be updated.
      return { githubUsernameSaveSuccess: true, savedUsername: newGithubUsername.trim() };

    } catch (e: any) {
      console.error('Exception saving GitHub username:', e);
      return fail(500, { githubUsernameSaveError: 'An unexpected error occurred while saving.' });
    }
  },
};
