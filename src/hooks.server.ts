// src/hooks.server.ts

// --- Imports ---
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from "$env/static/public";
import { createServerClient } from "@supabase/ssr";
import type { Handle } from "@sveltejs/kit";
import type { CookieSerializeOptions } from 'cookie';
import type { User } from '@supabase/supabase-js'

// --- Handle Hook ---
export const handle: Handle = async ({ event, resolve }) => {

  // 1. Create Server-Side Supabase Client FIRST
  event.locals.supabase = createServerClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        // Use the imported type for options
        get: (key: string) => {
          return event.cookies.get(key);
        },
        set: (key: string, value: string, options: CookieSerializeOptions) => {
          event.cookies.set(key, value, { ...options, path: options.path ?? '/'});
        },
        remove: (key: string, options: CookieSerializeOptions) => {
          event.cookies.delete(key, { ...options, path: options.path ?? '/'});
        },
      },
    }
  );

  // 2. Define Session Helper SECOND (uses the client created above)
  event.locals.getSession = async () => {
    const { data: { user }, error } = await event.locals.supabase.auth.getUser();
    if (error) {
      // It's good practice to not log the actual error in production
      // Consider using a proper logging service instead of console.error long-term
      console.error("Error getting session in hook:", error.message);
      return null;
    }
    return user;
  };

  // 3. Resolve the Request
  const response = await resolve(event, {
    filterSerializedResponseHeaders: (name) => name === 'content-range',
  });

  return response;

};