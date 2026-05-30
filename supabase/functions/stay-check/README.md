# Stay Check Edge Function

Migrated from `src/app/api/stay-check/v2/route.ts` to Supabase Edge Functions on 2026-05-30.

## Why moved here

- **Cost**: free up to 500k requests/mo (vs Vercel Pro / Cloudflare Workers Paid)
- **Cold start**: Edge runtime starts in ~50ms (vs Vercel Functions ~500ms)
- **Resilience**: not coupled to web server uptime — if Droplet restarts, Stay Check still works
- **Long-running OK**: 150s wall-time limit (Gemini Search Grounding usually takes 20-40s)

## Local testing

```bash
# Start Supabase locally (requires Docker)
npx supabase start

# Serve the function on http://localhost:54321/functions/v1/stay-check
npx supabase functions serve stay-check --env-file .env.local

# Test
curl -X POST http://localhost:54321/functions/v1/stay-check \
  -H "Authorization: Bearer $(npx supabase status -o json | jq -r .anon_key)" \
  -H "Content-Type: application/json" \
  -d '{"accommodationName":"Villa Bilic","location":"Trogir","locale":"hr"}'
```

## Deploy to production

```bash
# Link to your project (one-time)
npx supabase link --project-ref <your-project-ref>

# Push secrets
npx supabase secrets set \
  GEMINI_API_KEY_1=... \
  GEMINI_API_KEY_2=... \
  BOOKING_AFFILIATE_ID=...

# Deploy
npx supabase functions deploy stay-check

# Verify
curl -X POST https://<project-ref>.supabase.co/functions/v1/stay-check \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"accommodationName":"Villa Bilic","location":"Trogir","locale":"en"}'
```

## Required env vars / secrets

| Name | Source | Notes |
|---|---|---|
| `SUPABASE_URL` | Auto-populated by Supabase | |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-populated by Supabase | Used for cache + rate-limit table access |
| `GEMINI_API_KEY_1` | Manual via `supabase secrets set` | Primary Gemini key |
| `GEMINI_API_KEY_2` | Manual (optional) | Fallback if key 1 fails |
| `BOOKING_AFFILIATE_ID` | Manual | Booking.com affiliate ID for outbound links |

## Frontend integration

The browser calls this function directly (no proxy through Next.js):

```typescript
// src/components/stay-check/StayCheckClient.tsx
const STAY_CHECK_URL = process.env.NEXT_PUBLIC_STAY_CHECK_URL
  || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/stay-check`;

const response = await fetch(STAY_CHECK_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
  },
  body: JSON.stringify({ accommodationName, location, locale }),
});
```

## Database schema (unchanged — reuses existing tables)

The function reads/writes the same Supabase tables the old Vercel route used:
- `stay_check_cache` — keyed by sanitized `accommodation-location`, 365-day TTL
- `stay_check_rate_limit` — keyed by `(ip, date)`, daily counter

No schema changes needed for migration.
