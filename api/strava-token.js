/**
 * Strava OAuth token exchange — STUB, not yet wired up.
 *
 * GitHub Pages only serves static files, so this can't run there directly.
 * To use this, deploy it as a serverless function on a platform that supports
 * one, e.g.:
 *   - Cloudflare Workers (free tier, recommended — fast, simple)
 *   - Vercel serverless function (/api/strava-token.js works out of the box
 *     if this whole site is also deployed on Vercel instead of/alongside Pages)
 *   - Netlify function
 *
 * WHY THIS IS NEEDED:
 * Strava's OAuth flow requires exchanging an authorization code for an access
 * token using your app's "Client Secret". That secret must never be exposed
 * in frontend JS (anyone could view-source it and use it to impersonate your
 * app). So this exchange has to happen server-side.
 *
 * FLOW ONCE WIRED UP:
 *   1. Register an app at https://www.strava.com/settings/api to get a
 *      Client ID and Client Secret.
 *   2. Add a "Connect Strava" button in the app that redirects to:
 *        https://www.strava.com/oauth/authorize
 *          ?client_id=YOUR_CLIENT_ID
 *          &redirect_uri=YOUR_SITE_URL/strava-callback
 *          &response_type=code
 *          &scope=activity:read_all
 *   3. Strava redirects back with a `code` query param.
 *   4. Frontend sends that code to THIS function.
 *   5. This function exchanges it for an access_token + refresh_token by
 *      calling Strava's /oauth/token endpoint with the Client Secret attached.
 *   6. Return the tokens to the frontend (or store them server-side, depending
 *      on how much you trust the browser to hold a refresh token).
 *   7. Frontend uses the access_token to call Strava's /athlete/activities
 *      endpoint and maps results into the app's cardio log format.
 *
 * Client ID is fine to expose in frontend code. Client Secret is NOT — it
 * should be stored as an environment variable on whichever platform hosts
 * this function (e.g. Cloudflare Worker secret, Vercel env var), never
 * committed to the repo.
 *
 * Below is a skeleton for a Cloudflare Worker version. Adjust per platform
 * when you're ready to deploy it.
 */

export default {
  async fetch(request, env) {
    // Only accept POST requests with a Strava auth code
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const { code } = await request.json();
    if (!code) {
      return new Response(JSON.stringify({ error: 'Missing code' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // env.STRAVA_CLIENT_ID and env.STRAVA_CLIENT_SECRET should be set as
    // Worker secrets — never hardcode them here.
    const tokenRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: env.STRAVA_CLIENT_ID,
        client_secret: env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      return new Response(JSON.stringify({ error: 'Token exchange failed' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const tokenData = await tokenRes.json();
    // tokenData includes access_token, refresh_token, expires_at, athlete info

    return new Response(JSON.stringify(tokenData), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
