# Webappzz Clinic

Webappzz Clinic is a Next.js 16 appointment-token application for a multi-doctor clinic. Clients can browse doctors, sign in with Google, request appointment slots, and track token approvals. Admins manage doctors, schedules, overrides, and approvals from the same app.

## What is implemented

- Public clinic homepage plus doctor directory and doctor profile pages
- Google sign-in with Supabase SSR session handling
- Booking flow with date/time slot selection and pending-approval submission
- Client dashboard with upcoming bookings, cancellations, and reschedule requests
- Admin dashboard for appointment approval, doctor visibility, weekly schedules, and date overrides
- Availability JSON API at `/api/availability`
- Supabase schema with RLS, seeded clinic settings, booking lifecycle RPCs, and token assignment logic
- Vercel-ready auth proxy for stable Supabase cookies in production

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Add your Supabase project URL and publishable key.
3. In Supabase SQL Editor, run [supabase/schema.sql](/C:/Users/lenovo/Desktop/clinical%20appoinment/webappzz-clinic/supabase/schema.sql).
4. Run [supabase/seed.sql](/C:/Users/lenovo/Desktop/clinical%20appoinment/webappzz-clinic/supabase/seed.sql) to load sample doctors and schedules.
5. In Supabase Auth, enable Google and add these redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://your-vercel-domain.vercel.app/auth/callback`
   - `https://your-custom-domain/auth/callback`
6. Start the app with `npm run dev`.

## Admin access

You have two ways to make an account an admin:

1. Recommended: set `ADMIN_EMAILS` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` and Vercel. When that email signs in, the app upgrades the profile to `admin`.
2. Manual SQL fallback after first login:

```sql
update public.profiles
set role = 'admin'
where email = 'you@example.com';
```

## Supabase notes

- The app no longer uses demo auth or in-memory data.
- Booking, reschedule, cancel, reject, and approve flows are enforced through SQL functions in [supabase/schema.sql](/C:/Users/lenovo/Desktop/clinical%20appoinment/webappzz-clinic/supabase/schema.sql).
- Approval assigns token numbers per doctor per day inside Supabase.
- Notification logs are queued in `notification_logs` so a WhatsApp worker can be added later without changing the booking flow.

## Deploy to Vercel

1. Push this project to GitHub.
2. Import the repository into Vercel.
3. Add the same environment variables from `.env.local` to the Vercel project.
4. Redeploy after env vars are saved.
5. Add your Vercel and custom-domain callback URLs in Supabase Auth before testing sign-in.

## Scripts

```bash
npm run dev
npm run lint
npm run build
```

## Important files

- [src/app](/C:/Users/lenovo/Desktop/clinical%20appoinment/webappzz-clinic/src/app): routes, server actions, auth callback, API handler
- [src/lib/data.ts](/C:/Users/lenovo/Desktop/clinical%20appoinment/webappzz-clinic/src/lib/data.ts): Supabase reads and server-side mutations
- [src/lib/auth.ts](/C:/Users/lenovo/Desktop/clinical%20appoinment/webappzz-clinic/src/lib/auth.ts): viewer session helpers and role guards
- [proxy.ts](/C:/Users/lenovo/Desktop/clinical%20appoinment/webappzz-clinic/proxy.ts): Supabase SSR cookie refresh for Next.js 16
- [supabase/schema.sql](/C:/Users/lenovo/Desktop/clinical%20appoinment/webappzz-clinic/supabase/schema.sql): schema, RLS, and booking lifecycle functions
- [supabase/seed.sql](/C:/Users/lenovo/Desktop/clinical%20appoinment/webappzz-clinic/supabase/seed.sql): starter doctors and schedule rules
