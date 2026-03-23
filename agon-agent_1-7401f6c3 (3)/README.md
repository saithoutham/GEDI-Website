# GEDI Website

GEDI is a Vite + React screening guidance app with Vercel serverless API routes and Supabase-backed guideline data.

## Local development

1. Install dependencies with `npm ci`
2. Create a local `.env` from `.env.example`
3. Run `npm run dev`

## Deploy to Vercel

Set these environment variables in Vercel:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_GOOGLE_AUTH_PROXY`

Then import the GitHub repository into Vercel and deploy.

## Notes

- `vercel.json` is safe to commit and does not contain secrets.
- `.env.example` shows the variables you need without storing real credentials.
- `node_modules` and build output are ignored and are not meant to be pushed.
