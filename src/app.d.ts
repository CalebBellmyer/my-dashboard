// See https://svelte.dev/docs/kit/types#app.d.ts

import type { SupabaseClient, User } from "@supabase/supabase-js";

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient;
			getSession(): Promise<User | null>;
			supabaseURL;
			supabaseKey;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
