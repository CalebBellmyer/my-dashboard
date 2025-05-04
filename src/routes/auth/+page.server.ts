import { supabase } from "$lib/supabaseClient";
import { fail, redirect } from "@sveltejs/kit";
import type { Actions, RequestEvent } from "./$types";

function validateEmail(email : string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email)
}

// Enforces a password to be at least 8 characters long
// including at least one lowercase letter
// one uppercase letter
// one digit
// one special character from the set
function validatePassword(password: string) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password)
}

export const actions = {
    // --- Login Action ---
    login: async ({ request, cookies}: RequestEvent) => {
        const formData = await request.formData();
        const emailValue = formData.get('email');
        const passwordValue = formData.get('password');

        if (typeof emailValue !== 'string' || typeof passwordValue !== 'string') {
        return fail(400, { error: 'Email and password must be provided as text.' });
        }

        const email = emailValue;
        const password = passwordValue; 

        // Validate data
        if (!validateEmail(email)) {
            return fail(400, {error: 'Error invalid email.'})
        }

        if (!validatePassword(password)) {
            return fail(400, {error: 'Error invalid password'})
        }

        // Supabase Login Call
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        })

        // Handle Supabase response
        //  -Check for error
        if (error) {
            console.error("supabase login error:", error.message, error)
            return fail(401, {error: 'Login failed'})
        }
        
        redirect(303, '/')
    },

    // --- Signup Action ---
    signup: async ({ request }: RequestEvent) => {
        // Extract Data
        const formData = await request.formData()
        const emailValue = formData.get('email')
        const passwordValue = formData.get('password')

        // Type Check it
        if (typeof emailValue !== 'string' || typeof passwordValue !== 'string') {
            return fail(400, { error: 'Email and password must be provided as text.' });
        }

        const email = emailValue;
        const password = passwordValue;

        // Validate Data

        if (!validateEmail(email)) {
            return fail(400, {error: 'Error invalid email.'})
        }

        if (!validatePassword(password)) {
            return fail(400, {error: 'Error invalid password'})
        }

        // SupaBase Signup
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
        })

        // Handle SupaBase Response
        if (error) { 

        console.error("Supabase signup error:", error.message, error); // Log message and full error

        if (error.message.includes("User already registered") || error.message.includes("already exists")) {
            // Use HTTP status 409 Conflict for existing user
            return fail(409, {
                error: 'A user with this email already exists.',
                email: emailValue // Pass back email to potentially repopulate form
            });
        }
        
        return fail(500, {
            error: 'An unexpected error occurred during signup. Please try again later.',
            email: emailValue
        });

    } 

        redirect(303, '/')
    }
}
