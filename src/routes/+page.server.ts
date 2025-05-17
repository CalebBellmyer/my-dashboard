// src/routes/+page.server.ts

import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, getSession } }) => {
  const user = await getSession(); // User object from Supabase (or null)

  let githubUsername: string | null = null;
  let githubUsernameError: string | null = null;

  // --- Bible Study Data ---
  let currentMemoryVerse: string | null = null;
  let readingLogEntries: { read_date: string; reading_book?: string | null; reading_chapter?: string | null }[] = [];
  let bibleDataError: string | null = null;

  if (user) {
    // --- Fetch GitHub Username and Memory Verse from user_settings ---
    try {
      const { data: userSettings, error: settingsDbError } = await supabase
        .from('user_settings')
        .select('github_username, current_memory_verse') // Fetch both settings
        .eq('user_id', user.id)
        .single();

      if (settingsDbError && settingsDbError.code !== 'PGRST116') { // PGRST116: 'single' row not found
        console.error('Error fetching user_settings from Supabase:', settingsDbError);
        githubUsernameError = 'Could not retrieve your GitHub username.';
        bibleDataError = 'Could not retrieve your Bible settings.';
      } else if (userSettings) {
        githubUsername = userSettings.github_username;
        currentMemoryVerse = userSettings.current_memory_verse;
      }
    } catch (e: any) {
      console.error('Exception fetching user_settings:', e);
      githubUsernameError = 'An error occurred while fetching GitHub username.';
      bibleDataError = 'An error occurred while fetching Bible settings.';
    }

    // --- Fetch Bible Reading Log ---
    try {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const { data: logData, error: logDbError } = await supabase
        .from('bible_reading_log')
        .select('read_date, reading_book, reading_chapter')
        .eq('user_id', user.id)
        .gte('read_date', oneYearAgo.toISOString().split('T')[0])
        .order('read_date', { ascending: false });

      if (logDbError) {
        console.error('Error fetching Bible reading log from Supabase:', logDbError);
        if (!bibleDataError) bibleDataError = 'Could not retrieve your reading log.';
      } else if (logData) {
        readingLogEntries = logData;
      }
    } catch (e: any) {
      console.error('Exception fetching Bible reading log:', e);
      if (!bibleDataError) bibleDataError = 'An error occurred while fetching your reading log.';
    }

  } else {
    githubUsernameError = 'User not authenticated.'; // Should be handled by layout redirect
    bibleDataError = 'User not authenticated.';    // Should be handled by layout redirect
  }

  return {
    githubUsername: githubUsername,
    githubUsernameError: githubUsernameError,
    bibleStudy: { // Group Bible-related data
        currentMemoryVerse: currentMemoryVerse,
        readingLogEntries: readingLogEntries,
        error: bibleDataError
    }
    // Weather and Lotto data are fetched client-side by their respective widgets
  };
};

// --- ACTIONS ---
export const actions: Actions = {
  saveGithubUsername: async ({ request, locals: { supabase, getSession } }) => {
    const user = await getSession();
    if (!user) {
      return fail(401, { githubUsernameSaveError: 'You must be logged in.' });
    }
    const formData = await request.formData();
    const newGithubUsername = formData.get('github_username');

    if (typeof newGithubUsername !== 'string' || !newGithubUsername.trim()) {
      return fail(400, { githubUsernameSaveError: 'GitHub username cannot be empty.', enteredUsername: newGithubUsername });
    }
    if (!/^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/.test(newGithubUsername)) {
        return fail(400, { githubUsernameSaveError: 'Invalid GitHub username format.', enteredUsername: newGithubUsername });
    }
    try {
      const { error: upsertError } = await supabase
        .from('user_settings')
        .upsert({ user_id: user.id, github_username: newGithubUsername.trim() }, { onConflict: 'user_id' });
      if (upsertError) {
        console.error('Error saving GitHub username:', upsertError);
        return fail(500, { githubUsernameSaveError: 'Failed to save GitHub username.' });
      }
      return { githubUsernameSaveSuccess: true, savedUsername: newGithubUsername.trim() };
    } catch (e: any) {
      console.error('Exception saving GitHub username:', e);
      return fail(500, { githubUsernameSaveError: 'An unexpected error occurred.' });
    }
  },

  saveMemoryVerse: async ({ request, locals: { supabase, getSession } }) => {
    const user = await getSession();
    if (!user) {
      return fail(401, { memoryVerseError: 'You must be logged in.' });
    }
    const formData = await request.formData();
    const memoryVerse = formData.get('current_memory_verse');

    if (typeof memoryVerse !== 'string') { // Can be an empty string
        return fail(400, { memoryVerseError: 'Invalid data format for memory verse.' });
    }
    try {
      const { error: upsertError } = await supabase
        .from('user_settings')
        .upsert({ user_id: user.id, current_memory_verse: memoryVerse.trim() }, { onConflict: 'user_id' });

      if (upsertError) {
        console.error('Error saving memory verse:', upsertError);
        return fail(500, { memoryVerseError: 'Failed to save memory verse.' });
      }
      return { memoryVerseSaveSuccess: true };
    } catch (e: any) {
      console.error('Exception saving memory verse:', e);
      return fail(500, { memoryVerseError: 'An unexpected error occurred.' });
    }
  },

  logBibleReading: async ({ request, locals: { supabase, getSession } }) => {
    const user = await getSession();
    if (!user) {
      return fail(401, { logReadingError: 'You must be logged in.' });
    }
    const formData = await request.formData();
    const book = formData.get('reading_book');
    const chapter = formData.get('reading_chapter');
    const readDate = new Date().toISOString().split('T')[0];

    if (typeof book !== 'string' || typeof chapter !== 'string') {
      return fail(400, { logReadingError: 'Book and chapter must be provided as text.', book, chapter });
    }
    // Book and chapter can be empty if desired, they will be stored as null.
    // Add specific validation here if they should not be empty.

    try {
      const { error: insertError } = await supabase
        .from('bible_reading_log')
        .insert({
          user_id: user.id,
          read_date: readDate,
          reading_book: book.trim() || null,
          reading_chapter: chapter.trim() || null
        });

      if (insertError) {
        if (insertError.code === '23505') { // Unique constraint violation (user_id, read_date)
          return fail(409, { logReadingError: "You've already logged your reading for today." });
        }
        console.error('Error logging Bible reading:', insertError);
        return fail(500, { logReadingError: 'Failed to log your reading.' });
      }
      return { logReadingSuccess: true }; // SvelteKit will re-run load after this
    } catch (e: any) {
      console.error('Exception logging Bible reading:', e);
      return fail(500, { logReadingError: 'An unexpected error occurred.' });
    }
  }
};
