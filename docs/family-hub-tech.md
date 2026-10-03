# Family Hub: technical design

**Status:** Draft for review, 03.10.2026
**Follows:** family-hub-prd.md

## Recommendation

Build one responsive web app and host it at a public URL. Every device, the hallway iPad, the kitchen iPad, phones and a desktop, opens the same address. No app store.

**Stack**

- **App:** Next.js (React). One codebase for the five screens. Install it on the iPads as a home-screen app (a PWA), so it opens full screen like an app.
- **Sign-in:** Google, via Supabase Auth. Parents sign in with the Google account that can see Team Vidvei. The iPads stay signed in.
- **Database:** Supabase Postgres. Holds todos, the shopping list, the weekly dinners and today's remember-notes. The calendar is not stored here.
- **Calendar:** Google Calendar API, read and write, against Team Vidvei (`a2l1soplp0mmktbtctpsb3o5mc@group.calendar.google.com`).
- **Weather:** MET Norway's forecast API (api.met.no) for Stabekk. Free, no key, and it is the forecast Yr uses.
- **Host:** Vercel for the app, Supabase for the database and auth. Both have a free tier that fits one household.

That is the smallest setup that does Google login, a shared database and a URL that works away from home.

## How the pieces talk

The browser never holds the Google Calendar secret. The Next.js server asks Google for Team Vidvei and asks Supabase for lists and notes. The iPad only talks to our URL.

- Daily summary: weather from MET, today's events from Team Vidvei, remember-notes from Supabase.
- Calendar page: Team Vidvei, both ways.
- Todos, shopping list, dinner planner: Supabase only.

## Choices

**1. Where it runs**

- **Vercel (recommended).** A public URL, HTTPS, deploys when we push code. The iPads work at home and phones work away from home.
- **On the Mac mini at home.** No hosting bill, and the data stays in the house. The iPads on the home network work. Phones away from home need a tunnel (Cloudflare Tunnel or Tailscale). You also own updates, backups and what happens when the Mac is off.
- **A small VPS** (Hetzner or similar). More control than Vercel, more to operate. Not worth it for this app.

**2. Where the lists live**

- **Supabase (recommended).** Postgres, Google login and a hosted database in one place.
- **Firebase.** Also fine, and closer to Google. Weaker fit once dinners and todos need ordinary relational data.
- **A database on the Mac mini.** Only if we also host the app there.

**3. What the iPad installs**

- **A website plus a home-screen icon (recommended).** One codebase, instant updates.
- **A native iOS app.** App Store review, two codebases, no benefit for these five screens.

## What I would not do

A separate mobile app, a second calendar inside our database, or self-hosting before the five screens work. Google sign-in plus Team Vidvei already decides a lot of the shape.

## Decisions

1. **Host: Vercel.** Decided 03.10.2026. The app gets a public URL. Supabase holds the database and Google sign-in.
2. Still open: is the Google account that owns Team Vidvei the one you will sign in with?
