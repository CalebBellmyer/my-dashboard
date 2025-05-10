// src/routes/api/github-contributions/+server.ts

import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GITHUB_PAT } from '$env/static/private'; // Import the PAT

export const GET: RequestHandler = async ({ url, fetch }) => {
  const githubUsername = url.searchParams.get('username');

  if (!githubUsername) {
    throw error(400, 'GitHub username is required as a query parameter.');
  }

  const graphqlQuery = `
    query($username: String!) {
      user(login: $username) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
                color
              }
            }
          }
        }
      }
    }
  `;

  const queryVariables = { username: githubUsername };

  // Prepare headers, including the Authorization header if a PAT is available
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'User-Agent': `SvelteKitDashboard-${githubUsername}` // Good practice to set a User-Agent
  };

  if (GITHUB_PAT) {
    headers['Authorization'] = `bearer ${GITHUB_PAT}`;
  } else {
    // Optional: Log a warning if PAT is missing during development,
    // as unauthenticated requests are heavily rate-limited.
    console.warn('GITHUB_PAT is not set. Making unauthenticated request to GitHub API.');
  }

  try {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: headers, // Use the prepared headers
      body: JSON.stringify({
        query: graphqlQuery,
        variables: queryVariables,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GitHub API error for ${githubUsername}: ${response.status} ${response.statusText}`, errorText);
      // Try to parse error from GitHub if it's JSON
      let githubErrorDetail = errorText;
      try {
        const ghErrorJson = JSON.parse(errorText);
        if (ghErrorJson.message) {
            githubErrorDetail = ghErrorJson.message;
        }
      } catch (parseError) {
        // Ignore if not JSON
      }
      throw error(response.status, `Failed to fetch GitHub data for ${githubUsername}: ${githubErrorDetail}`);
    }

    const githubResponse = await response.json();

    if (githubResponse.errors) {
      console.error(`GitHub GraphQL Errors for ${githubUsername}:`, githubResponse.errors);
      throw error(502, `Error in GitHub GraphQL response for ${githubUsername}: ${githubResponse.errors[0]?.message || 'Unknown GraphQL error'}`);
    }

    const contributionData = githubResponse.data?.user?.contributionsCollection?.contributionCalendar;

    if (!contributionData) {
      console.warn(`No contribution data found for user: ${githubUsername} via API route`, githubResponse.data);
      throw error(404, `No contribution data found for GitHub user: ${githubUsername}. Ensure the username is correct and has activity.`);
    }

    return json(contributionData);

  } catch (e: any) {
    if (e.status && e.body) {
      throw e; 
    }
    console.error(`Unexpected error in /api/github-contributions for ${githubUsername}:`, e);
    throw error(500, `An internal server error occurred while fetching GitHub data for ${githubUsername}: ${e.message}`);
  }
};
