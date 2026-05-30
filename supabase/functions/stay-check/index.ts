/**
 * Stay Check Edge Function (Supabase / Deno)
 *
 * Migrated from src/app/api/stay-check/v2/route.ts (2026-05-30).
 * Runs at the edge with no cold start, replaces Vercel/Droplet API route.
 *
 * Workflow:
 *   1. Check Supabase cache by accommodation+location key (365-day TTL)
 *   2. If cached in different language → translate via Gemini Flash
 *   3. Otherwise → call Gemini Search Grounding, parse, cache, return
 *
 * Rate limit: 3 requests/day per IP via Supabase table.
 */

// @ts-ignore - Deno-only import
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";
// @ts-ignore - Deno-only import
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2.100.1";

// ── Env helpers ─────────────────────────────────────────────────────
// @ts-ignore - Deno global
const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY_1") || Deno.env.get("GEMINI_API_KEY_2") || "";
// @ts-ignore - Deno global
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
// @ts-ignore - Deno global
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// @ts-ignore - Deno global
const BOOKING_AFFILIATE_ID = Deno.env.get("BOOKING_AFFILIATE_ID") || "YOUR_AFFILIATE_ID";

let _supabase: SupabaseClient | null = null;
function supabase(): SupabaseClient {
  if (!_supabase) _supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  return _supabase;
}

// ── Constants ────────────────────────────────────────────────────────
const CACHE_TTL_DAYS = 365;
const DAILY_LIMIT = 3;

const RATE_LIMIT_MESSAGES: Record<string, string> = {
  en: `You've reached your daily limit of ${DAILY_LIMIT} checks. Please try again tomorrow.`,
  hr: `Dosegli ste dnevni limit od ${DAILY_LIMIT} provjere. Pokušajte ponovo sutra.`,
  de: `Sie haben Ihr Tageslimit von ${DAILY_LIMIT} Prüfungen erreicht. Versuchen Sie es morgen erneut.`,
  it: `Hai raggiunto il limite giornaliero di ${DAILY_LIMIT} controlli. Riprova domani.`,
  fr: `Vous avez atteint votre limite quotidienne de ${DAILY_LIMIT} vérifications. Réessayez demain.`,
  es: `Has alcanzado tu límite diario de ${DAILY_LIMIT} verificaciones. Inténtalo de nuevo mañana.`,
  pl: `Osiągnąłeś dzienny limit ${DAILY_LIMIT} sprawdzeń. Spróbuj ponownie jutro.`,
  cz: `Dosáhli jste denního limitu ${DAILY_LIMIT} kontrol. Zkuste to znovu zítra.`,
  hu: `Elérted a napi ${DAILY_LIMIT} ellenőrzés limitedet. Próbáld újra holnap.`,
  sk: `Dosiahli ste denný limit ${DAILY_LIMIT} kontrol. Skúste to znova zajtra.`,
  nl: `Je hebt je dagelijkse limiet van ${DAILY_LIMIT} controles bereikt. Probeer het morgen opnieuw.`,
  sl: `Dosegli ste dnevno omejitev ${DAILY_LIMIT} preverjanj. Poskusite znova jutri.`,
  ru: `Вы достигли дневного лимита в ${DAILY_LIMIT} проверки. Попробуйте снова завтра.`,
};

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "https://bookiscout.com",
  "https://www.bookiscout.com",
];

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*", // tightened below per request
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey",
  "Access-Control-Max-Age": "86400",
};

// ── Cache ────────────────────────────────────────────────────────────
interface CachedReport {
  locale: string;
  data: Record<string, unknown>;
}

async function getCachedReport(key: string): Promise<CachedReport | null> {
  try {
    const { data, error } = await supabase()
      .from("stay_check_cache")
      .select("locale, data, created_at")
      .eq("key", key)
      .single();
    if (error || !data) return null;

    const created = new Date((data as { created_at: string }).created_at).getTime();
    if (Date.now() - created > CACHE_TTL_DAYS * 86400000) {
      await supabase().from("stay_check_cache").delete().eq("key", key);
      return null;
    }
    return {
      locale: (data as { locale: string }).locale,
      data: (data as { data: Record<string, unknown> }).data,
    };
  } catch {
    return null;
  }
}

async function setCachedReport(key: string, locale: string, data: Record<string, unknown>): Promise<void> {
  try {
    await supabase().from("stay_check_cache").upsert({
      key, locale, data,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[cache] write error:", err);
  }
}

// ── Rate limit ───────────────────────────────────────────────────────
async function checkRateLimit(ip: string): Promise<boolean> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase()
      .from("stay_check_rate_limit")
      .select("count")
      .eq("ip", ip).eq("date", today)
      .single();
    return !data || (data as { count: number }).count < DAILY_LIMIT;
  } catch { return true; }
}

async function incrementRateLimit(ip: string): Promise<void> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase()
      .from("stay_check_rate_limit")
      .select("count")
      .eq("ip", ip).eq("date", today)
      .single();
    if (data) {
      await supabase().from("stay_check_rate_limit")
        .update({ count: (data as { count: number }).count + 1 })
        .eq("ip", ip).eq("date", today);
    } else {
      await supabase().from("stay_check_rate_limit")
        .insert({ ip, date: today, count: 1 });
    }
  } catch (err) {
    console.error("[rate-limit] error:", err);
  }
}

// ── Citation stripper (Gemini Search Grounding leaks "[cite: 3, 4]" etc) ──
function stripCitations<T>(value: T): T {
  if (typeof value === "string") {
    return value
      .replace(/\[cite:[^\]]*\]/gi, "")
      .replace(/\((?:from\s+)?(?:previous\s+)?search[^)]*\)/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim() as unknown as T;
  }
  if (Array.isArray(value)) return value.map(stripCitations) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = stripCitations(v);
    }
    return out as unknown as T;
  }
  return value;
}

function parseJSON(text: string): Record<string, unknown> | null {
  let clean = text;
  const cb = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (cb) clean = cb[1];
  try { return JSON.parse(clean); } catch {
    const m = clean.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch { /* */ } }
    return null;
  }
}

// ── Translate cached report to another language ──────────────────────
async function translateReport(
  report: Record<string, unknown>,
  fromLocale: string,
  toLocale: string,
): Promise<Record<string, unknown>> {
  if (!GEMINI_KEY) return report;
  const genAI = new GoogleGenerativeAI(GEMINI_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { temperature: 0, responseMimeType: "application/json" },
  });

  const prompt = `Translate the following JSON report from "${fromLocale}" to "${toLocale}".
RULES:
- Translate ALL text values (descriptions, reasons, summaries, advice, quotes)
- Keep place names, restaurant names, beach names in their ORIGINAL form
- Keep numbers, scores, distances, prices unchanged
- Keep JSON structure exactly the same
- NEVER use English phrases — translate everything to "${toLocale}"

JSON to translate:
${JSON.stringify(report)}`;

  try {
    const result = await model.generateContent(prompt);
    return parseJSON(result.response.text()) || report;
  } catch (err) {
    console.error("[translate] failed:", err);
    return report;
  }
}

// ── Booking links generator ──────────────────────────────────────────
function generateBookingLinks(locality: string) {
  const params = new URLSearchParams({
    aid: BOOKING_AFFILIATE_ID, ss: `${locality}, Croatia`, lang: "en",
  });
  return {
    booking: `https://www.booking.com/searchresults.html?${params.toString()}`,
    airbnb: `https://www.airbnb.com/s/${encodeURIComponent(locality + ", Croatia")}/homes`,
    apartmanija: `https://www.apartmanija.hr/pretraga?lokacija=${encodeURIComponent(locality)}`,
  };
}

// ── Main handler ─────────────────────────────────────────────────────
interface StayCheckRequest {
  accommodationName: string;
  location: string;
  address?: string;
  locale?: string;
}

// @ts-ignore - Deno global
Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "content-type": "application/json" },
    });
  }

  try {
    const body = await req.json() as StayCheckRequest;
    const locale = body.locale || "en";

    // Origin allow-list (allow any subdomain of bookiscout.com + localhost)
    const origin = req.headers.get("origin") || "";
    const isAllowed =
      !origin ||
      ALLOWED_ORIGINS.some((o) => origin === o) ||
      origin.endsWith(".bookiscout.com") ||
      (origin.endsWith(".vercel.app") && origin.includes("booki-scout"));
    if (origin && !isAllowed) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...CORS_HEADERS, "content-type": "application/json" },
      });
    }

    if (!body.accommodationName || !body.location) {
      return new Response(
        JSON.stringify({ error: "Please provide accommodation name and location" }),
        { status: 400, headers: { ...CORS_HEADERS, "content-type": "application/json" } },
      );
    }

    // Rate limit by IP (Supabase Edge populates x-forwarded-for)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("x-real-ip")
      || "unknown";

    const allowed = await checkRateLimit(ip);
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: RATE_LIMIT_MESSAGES[locale] || RATE_LIMIT_MESSAGES.en }),
        { status: 429, headers: { ...CORS_HEADERS, "content-type": "application/json" } },
      );
    }

    const accommodationName = body.accommodationName.trim();
    const location = body.location.trim();
    const address = body.address?.trim() || "";

    const cacheKey = `${accommodationName}-${location}`
      .toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0, 80);

    // Cache hit
    const cached = await getCachedReport(cacheKey);
    if (cached) {
      console.log(`[stay-check] cache hit (${cached.locale}): ${cacheKey}`);

      if (cached.locale === locale) {
        return new Response(JSON.stringify(stripCitations(cached.data)), {
          headers: { ...CORS_HEADERS, "content-type": "application/json" },
        });
      }

      console.log(`[stay-check] translating ${cached.locale} → ${locale}`);
      const translated = await translateReport(
        cached.data.analysis as Record<string, unknown>,
        cached.locale, locale,
      );
      return new Response(
        JSON.stringify(stripCitations({ ...cached.data, analysis: translated })),
        { headers: { ...CORS_HEADERS, "content-type": "application/json" } },
      );
    }

    // Cache miss → Gemini Search Grounding
    if (!GEMINI_KEY) throw new Error("No Gemini API key configured");

    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      // deno-lint-ignore no-explicit-any
      tools: [{ googleSearch: {} } as any],
      generationConfig: { temperature: 0 },
    });

    const addressInfo = address ? `\nAddress: ${address}` : "";
    const localeInstruction = locale !== "en" ? `\nIMPORTANT LANGUAGE RULES:
- Write ALL text values in "${locale}" language. Place names stay in original form.
- NEVER use English phrases like "No data found", "wheelchair", "unknown" — always translate to "${locale}".
- ALL descriptions, reasons, summaries, advice — everything must be in "${locale}".` : "";

    const prompt = `You are a travel accommodation analyst. Research the following accommodation using Google Search to find real guest reviews, ratings, and nearby place information.${localeInstruction}

ACCOMMODATION: "${accommodationName}" in ${location}, Croatia${addressInfo}

CRITICAL IDENTITY RULES:
- There may be MULTIPLE accommodations with the same or similar name in different towns. You MUST only report data for the EXACT accommodation at the EXACT address/location above.
- If the accommodation is NOT listed on Booking.com or other platforms, say so — do NOT report ratings from a different property.
- If you cannot find reviews for this SPECIFIC property, say so — do NOT substitute reviews from another property.

RESEARCH RULES:
- ONLY report facts from real sources (Booking.com, Google, TripAdvisor, local directories, own website)
- If no data found, say so — NEVER invent
- Search for: "restaurants in ${location}", "bars in ${location}", "cafes in ${location}" to find ALL nearby places
- For BEACHES: search "beaches in ${location}", "plaže ${location}" — list ALL beaches within 3km. Croatian coastal towns typically have multiple small beaches. Include named beaches, unnamed coves, and beach bars.
- Include small local places too, not just popular ones
- ALL prices in EUROS (€)

SCORING RULES:
- Score 0-100 per guest type. Be STRICT and HONEST.
- NEVER give all guest types the same score — differentiate based on actual amenities.
- Family score depends on: kid-safe beaches, playgrounds, quiet, restaurants with kids menu
- Couple score depends on: romantic spots, restaurants, sunsets, nightlife, privacy
- Group score depends on: nightlife, bars, activities, restaurants, space
- Solo score depends on: walkability, cafes, wifi, safety, public transport
- Digital nomad score depends on: wifi quality, cafes with power, quiet workspace, walkability

Respond in this EXACT JSON format (no markdown, no code blocks):
{
  "overallScore": 75,
  "scoreExplanation": "2-3 sentences WHY this score",
  "familyScore": 80, "familyScoreReason": "reason",
  "coupleScore": 85, "coupleScoreReason": "reason",
  "groupScore": 70, "groupScoreReason": "reason",
  "soloScore": 65, "soloScoreReason": "reason",
  "nomadScore": 60, "nomadScoreReason": "reason",
  "shortSummary": "2-3 friendly sentences overview of this accommodation and area",
  "pros": ["pro 1 with specific details", "pro 2", "pro 3", "pro 4", "pro 5"],
  "cons": ["con 1 with details", "con 2", "con 3"],
  "risks": ["risk 1", "risk 2"],
  "realityCheck": "3-4 sentences vivid picture of daily life here",
  "beachReport": {
    "beaches": [{"name": "Beach Name", "distance": "150m", "type": "pebble/sand/rocky", "waterEntry": "shallow/gradual/steep", "kidsSafe": true, "disabilityAccess": "info or unknown", "facilities": "showers, bar, sunbeds", "crowding": "quiet/moderate/crowded in summer", "bestQuote": "review quote"}],
    "bestForKids": "which beach and why",
    "bestForRelaxing": "which beach and why"
  },
  "bestRestaurant": {"name": "Name", "distance": "200m", "whyBest": "review quote", "priceRange": "€15-25"},
  "worstRestaurant": {"name": "Name", "distance": "300m", "whyWorst": "reason"},
  "allRestaurants": [{"name": "Name", "rating": "4.5", "knownFor": "specialty", "priceRange": "€10-20"}],
  "priceComparison": {
    "thisArea": "what guests say about prices",
    "guestVerdict": "cheap/moderate/expensive for Croatia",
    "specificPrices": ["Coffee: €1.5-2", "Beer: €3-4", "Pizza: €8-12", "Fish dish: €12-20", "Dinner for 2: €30-50"],
    "note": "source"
  },
  "allBars": [{"name": "Name", "type": "cocktail/wine/beach bar", "rating": "4.2", "distance": "300m", "atmosphere": "vibe", "bestFor": "couples/groups", "prices": "Beer €3, Cocktail €7", "openUntil": "midnight", "bestQuote": ""}],
  "allCafes": [{"name": "Name", "rating": "4.3", "distance": "200m", "knownFor": "coffee/cakes/view", "prices": "Coffee €2, Cake €3", "terrace": true, "bestQuote": ""}],
  "nightlife": "overall nightlife scene description",
  "attractions": [{"name": "Name", "distance": "500m", "description": "what it is", "entryPrice": "€5 or free", "bestQuote": "visitor review", "familyFriendly": true}],
  "activities": ["activity 1 with details", "activity 2"],
  "topFinds": ["hidden gem 1 from reviews", "hidden gem 2", "hidden gem 3"],
  "walkabilityDescription": "from front door: nearest beach Xm, restaurant Xm, supermarket Xm, pharmacy Xm",
  "townCenterInfo": "distance to center, what is there",
  "shopping": "nearest supermarket: name, distance",
  "pharmacy": "nearest pharmacy: name, distance",
  "doctor": "nearest doctor: name, distance",
  "atm": "nearest ATM: distance",
  "playground": "nearest playground: name, distance",
  "bakery": "nearest bakery: name, distance",
  "iceCream": "ice cream shop info or empty string",
  "gasStation": "nearest gas station or empty string",
  "noiseAssessment": "noise from reviews. No mentions = quiet",
  "familySafetyNotes": ["note 1 about family safety", "note 2", "note 3"],
  "accessibilityReport": {"wheelchairFriendly": "assessment", "beachAccess": "info", "terrain": "flat/hilly", "notes": ["observation"]},
  "finalAdvice": "3-4 sentences honest summary — who is this place best for and who should avoid it",
  "seasonalAdvice": "general seasonal advice: when is best to visit, peak vs off-season differences",
  "questionsForHost": ["question 1", "question 2", "question 3", "question 4", "question 5"],
  "alternativeAreas": [{"name": "nearby town", "pros": ["advantage 1", "advantage 2"], "cons": ["disadvantage 1"], "bookingSearchQuery": "search term"}],
  "budgetEstimate": {"dailyLow": 40, "dailyHigh": 80, "tips": ["money saving tip 1", "tip 2", "tip 3"]},
  "accommodationRating": "X.X from source",
  "accommodationReviewCount": 0
}`;

    console.log(`[stay-check] searching: "${accommodationName}" in "${location}"`);
    const start = Date.now();
    const result = await model.generateContent(prompt);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`[stay-check] gemini responded in ${elapsed}s`);

    const text = result.response.text();
    const parsed = parseJSON(text);
    if (!parsed) {
      console.error("[stay-check] failed to parse:", text.substring(0, 500));
      throw new Error("Failed to parse AI response");
    }

    const analysis = stripCitations(parsed);
    const a = analysis as Record<string, unknown>;
    const overallScore = parseInt(String(a.overallScore)) || 50;

    const response = {
      accommodation: {
        name: accommodationName,
        location: {
          formattedAddress: address || `${accommodationName}, ${location}, Croatia`,
          locality: location,
        },
        platform: "Direct",
        googleReviews: (
          a.accommodationRating &&
          !String(a.accommodationRating).toLowerCase().includes("no ") &&
          !String(a.accommodationRating).toLowerCase().includes("nema")
        ) ? {
          rating: parseFloat(String(a.accommodationRating)) || 0,
          reviewCount: parseInt(String(a.accommodationReviewCount)) || 0,
        } : null,
      },
      areaData: {},
      reviewAnalysis: {
        totalReviewsAnalyzed: parseInt(String(a.accommodationReviewCount)) || 0,
        patterns: [],
        seasonalInsights: [],
      },
      scores: {
        overallScore,
        categories: {},
        guestTypeScores: {
          family: { score: parseInt(String(a.familyScore)) || 50, comment: String(a.familyScoreReason || "") },
          couple: { score: parseInt(String(a.coupleScore)) || 50, comment: String(a.coupleScoreReason || "") },
          group: { score: parseInt(String(a.groupScore)) || 50, comment: String(a.groupScoreReason || "") },
          solo: { score: parseInt(String(a.soloScore)) || 50, comment: String(a.soloScoreReason || "") },
          "digital-nomad": { score: parseInt(String(a.nomadScore)) || 50, comment: String(a.nomadScoreReason || "") },
        },
      },
      analysis: a,
      bookingLinks: generateBookingLinks(location),
    };

    // Cache + rate limit increment in parallel
    await Promise.all([
      setCachedReport(cacheKey, locale, response),
      incrementRateLimit(ip),
    ]);

    return new Response(JSON.stringify(response), {
      headers: { ...CORS_HEADERS, "content-type": "application/json" },
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[stay-check] error:", errMsg);
    return new Response(
      JSON.stringify({ error: "Analysis failed: " + errMsg.substring(0, 200) }),
      { status: 500, headers: { ...CORS_HEADERS, "content-type": "application/json" } },
    );
  }
});
