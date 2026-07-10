# Northstar spending analyzer

A privacy-minded Next.js app that turns RBC purchase notification text into categorized spending insights.

## Run locally

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and add Supabase values when you are ready to connect persistence.
4. Run `npm run dev` and open `http://localhost:3000`.

Without Supabase values, the interface runs in demo mode. The parser and import preview still work.

## Supabase setup

Create a project, then run `supabase/schema.sql`, `supabase/policies.sql`, and `supabase/auth-categories-migration.sql` in that order. RLS is enabled for every user-owned table. Never expose a service-role key to the browser.

## Parser

The TypeScript parser preserves the established RBC labels from `email_parser.py` and adds defensive amount/date handling and merchant normalization. Run `npm run test:parser` to verify the sample cases.

## Security notes

- Raw email bodies are not stored.
- Local OAuth files, tokens, databases, and `.env` files are ignored.
- Existing Google OAuth credentials should be revoked and replaced if they were ever committed or shared.
- Gmail OAuth uses the `gmail.modify` scope so matching messages can be read and marked as read after import. Refresh tokens are encrypted before database storage.

## Gmail connection

1. Enable the Gmail API in Google Cloud and create an OAuth 2.0 Web application client.
2. Add `http://localhost:3000/api/gmail/callback` as an authorized redirect URI.
3. Add the Google client ID and secret to `.env.local` using `.env.example` as the guide.
4. Generate a long random `GMAIL_TOKEN_ENCRYPTION_KEY`; changing it later disconnects existing Gmail connections.
5. Run `supabase/gmail-connection-migration.sql`, restart the app, then connect Gmail from Settings.
