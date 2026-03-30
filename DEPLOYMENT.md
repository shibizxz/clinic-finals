# Deployment Guide

## 1. Push to GitHub

1. Create a GitHub repository.
2. Push the contents of this project.
3. Make sure your default production branch is the one you want Vercel to deploy, usually `main`.

## 2. Prepare Supabase

1. Create a Supabase project.
2. Run [supabase/schema.sql](/C:/Users/lenovo/Desktop/clinical%20appoinment/webappzz-clinic/supabase/schema.sql).
3. Run [supabase/seed.sql](/C:/Users/lenovo/Desktop/clinical%20appoinment/webappzz-clinic/supabase/seed.sql).
4. In Supabase Auth, enable Google.
5. Add these redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://YOUR_PROJECT.vercel.app/auth/callback`
   - `https://YOUR_DOMAIN/auth/callback`

## 3. Import into Vercel

1. In Vercel, click `New Project`.
2. Import the GitHub repository.
3. Leave the framework as Next.js.
4. Add these environment variables in Project Settings -> Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` if your Supabase project still uses anon-key naming
   - `SUPABASE_SERVICE_ROLE_KEY` if you want automatic admin bootstrap
   - `ADMIN_EMAILS` as a comma-separated list for clinic admin emails
5. Redeploy after saving environment variables.

## 4. Make an Admin

Recommended:

- Set `ADMIN_EMAILS` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel before the first admin signs in.

Manual fallback:

```sql
update public.profiles
set role = 'admin'
where email = 'you@example.com';
```

## 5. Connect a GoDaddy Domain to Vercel

### Option A: Keep GoDaddy nameservers

Use this if you already manage email or other DNS records in GoDaddy.

1. In Vercel, open your project -> Settings -> Domains.
2. Add your apex domain, for example `yourdomain.com`.
3. Let Vercel also add `www.yourdomain.com` when prompted.
4. Vercel will show the DNS records it expects.
5. In GoDaddy, open the domain -> DNS.
6. Add the root `A` record for `@` using the value Vercel shows for the apex domain.
7. Add the `CNAME` record for `www` using the value Vercel shows for the subdomain.
8. Wait for verification to complete in Vercel.

### Option B: Move DNS to Vercel nameservers

Use this only if you want Vercel to become the DNS host for the whole domain.

1. In Vercel Domains, choose the nameserver method.
2. Copy the Vercel nameservers shown in the dashboard.
3. In GoDaddy, open the domain -> DNS -> Nameservers.
4. Choose custom nameservers and paste the Vercel nameservers.
5. Recreate any existing mail or DNS records inside Vercel DNS before switching, because DNS management moves away from GoDaddy.

## 6. Final checks

1. Visit the Vercel domain and sign in with Google.
2. Confirm that the admin email lands in `/admin`.
3. Confirm doctor pages, booking, dashboard, and admin approval all work.
4. Update Supabase Auth redirect URLs once the final custom domain is live.

## Official references

- Vercel GitHub deployments: [https://vercel.com/github](https://vercel.com/github)
- Vercel environment variables: [https://vercel.com/docs/environment-variables/manage-across-environments](https://vercel.com/docs/environment-variables/manage-across-environments)
- Vercel existing-domain setup: [https://vercel.com/docs/getting-started-with-vercel/use-existing](https://vercel.com/docs/getting-started-with-vercel/use-existing)
- Vercel domains CLI reference: [https://vercel.com/docs/cli/domains](https://vercel.com/docs/cli/domains)
- GoDaddy nameservers: [https://help.dc-aws.godaddy.com/help/edit-my-domain-nameservers-664](https://help.dc-aws.godaddy.com/help/edit-my-domain-nameservers-664)
- GoDaddy A records: [https://www.godaddy.com/help/add-an-a-record-19238](https://www.godaddy.com/help/add-an-a-record-19238)
- GoDaddy CNAME records: [https://www.godaddy.com/help/add-a-cname-record-19236](https://www.godaddy.com/help/add-a-cname-record-19236)
