# Gurupith WhatsApp Analytics

A responsive dashboard for monitoring incoming WhatsApp conversations stored in Supabase. Includes live refresh, message search, date range filtering, activity summaries, and a persistent light/dark theme.

## Stack

- Next.js 16 App Router and React 19
- TypeScript
- Tailwind CSS 4 (with custom dashboard styling)
- Supabase REST API

## Requirements

- Node.js 20 or newer
- A Supabase project with a `public.whatsapp_bot_messages` table

The table should include `id`, `whatsapp_mobile`, `profile_name`, `message_type`, `message_text`, `message_timestamp`, and `direction` columns. The dashboard queries incoming rows and displays up to the latest 500 matching messages.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and set your Supabase project URL and service role key. Keep `.env.local` private and never commit it.

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

## Available scripts

- `npm run dev` — start the development server
- `npm run build` — create a production build
- `npm run start` — serve a production build
- `npm run lint` — run ESLint

## Data and access

The analytics API reads Supabase on the server and sends the service role key only in server-side requests. The dashboard endpoint itself is not an authentication system. Add access control before exposing this app to the public internet, and use a restricted database role where possible.

The summary cards are calculated from the current result set. When no date range is selected, that set is capped at 500 recent messages, so the cards are not all-time totals.
