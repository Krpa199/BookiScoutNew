/**
 * Stay Check V2 API Route
 * - 1 Gemini Search Grounding call per accommodation (cached 1 year in Supabase)
 * - If cached in different language → translate with plain Gemini (no grounding, $0)
 * - Rate limit: 3/day per IP
 * - Cost: $0 for 50-500 visitors/day
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  getCachedReport, setCachedReport,
  checkRateLimit, incrementRateLimit, getRateLimitMessage,
} from '@/lib/supabase-cache';
import { stripCitations } from '@/lib/gemini-analyzer';

export const maxDuration = 60;

interface StayCheckRequest {
  accommodationName: string;
  location: string;
  address?: string;
  locale?: string;
}

function getGeminiKey(): string {
  return process.env.GEMINI_API_KEY_1 || process.env.GEMINI_API_KEY_2 || '';
}

function parseJSON(text: string): Record<string, unknown> | null {
  let clean = text;
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) clean = codeBlockMatch[1];
  try { return JSON.parse(clean); } catch {
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (jsonMatch) { try { return JSON.parse(jsonMatch[0]); } catch { /* */ } }
    return null;
  }
}

// ── Translate cached report to another language ─────────────────────
async function translateReport(
  report: Record<string, unknown>,
  fromLocale: string,
  toLocale: string
): Promise<Record<string, unknown>> {
  const apiKey = getGeminiKey();
  if (!apiKey) return report;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { temperature: 0, responseMimeType: 'application/json' },
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
    console.error('[StayCheck V2] Translation failed:', err);
    return report;
  }
}

// ── Main Handler ────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as StayCheckRequest;
    const locale = body.locale || 'en';

    // Block requests from external origins
    const origin = request.headers.get('origin') || '';
    const allowedOrigins = [
      'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002',
      'https://bookiscout.com', 'https://www.bookiscout.com',
    ];
    const isVercelPreview = origin.endsWith('.vercel.app') && origin.includes('booki-scout');
    if (origin && !isVercelPreview && !allowedOrigins.some(o => origin.startsWith(o))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!body.accommodationName || !body.location) {
      return NextResponse.json(
        { error: 'Please provide accommodation name and location' },
        { status: 400 }
      );
    }

    // Rate limit by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    const allowed = await checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: getRateLimitMessage(locale) },
        { status: 429 }
      );
    }

    const accommodationName = body.accommodationName.trim();
    const location = body.location.trim();
    const address = body.address?.trim() || '';

    // Cache key — same for ALL languages
    const cacheKey = `${accommodationName}-${location}`
      .toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 80);

    // Check Supabase cache
    const cached = await getCachedReport(cacheKey);
    if (cached) {
      console.log(`[StayCheck V2] Cache hit (${cached.locale}): ${cacheKey}`);

      if (cached.locale === locale) {
        // Same language — return directly. Strip citation markers from any
        // older cached entries that were saved before sanitization existed.
        return NextResponse.json(stripCitations(cached.data));
      }

      // Different language — translate analysis part only
      console.log(`[StayCheck V2] Translating ${cached.locale} → ${locale}`);
      const translated = await translateReport(
        cached.data.analysis as Record<string, unknown>,
        cached.locale,
        locale
      );
      return NextResponse.json(stripCitations({ ...cached.data, analysis: translated }));
    }

    // ── Gemini Search Grounding ──────────────────────────────────────
    const apiKey = getGeminiKey();
    if (!apiKey) throw new Error('No Gemini API key configured');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [{ googleSearch: {} } as any],
      generationConfig: { temperature: 0 },
    });

    const addressInfo = address ? `\nAddress: ${address}` : '';

    const localeInstruction = locale !== 'en' ? `\nIMPORTANT LANGUAGE RULES:
- Write ALL text values in "${locale}" language. Place names stay in original form.
- NEVER use English phrases like "No data found", "wheelchair", "unknown" — always translate to "${locale}".
- ALL descriptions, reasons, summaries, advice — everything must be in "${locale}".` : '';

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

    console.log(`[StayCheck V2] Searching: "${accommodationName}" in "${location}"`);
    const start = Date.now();
    const result = await model.generateContent(prompt);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`[StayCheck V2] Gemini responded in ${elapsed}s`);

    const text = result.response.text();
    const parsed = parseJSON(text);

    if (!parsed) {
      console.error('[StayCheck V2] Failed to parse:', text.substring(0, 500));
      throw new Error('Failed to parse AI response');
    }

    // Gemini Search Grounding leaks "[cite: 3, 4 (from previous search)]" markers
    // into the JSON string values. Strip them recursively before saving/returning.
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
        platform: 'Direct',
        googleReviews: (a.accommodationRating && !String(a.accommodationRating).toLowerCase().includes('no ') && !String(a.accommodationRating).toLowerCase().includes('nema')) ? {
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
          family: { score: parseInt(String(a.familyScore)) || 50, comment: String(a.familyScoreReason || '') },
          couple: { score: parseInt(String(a.coupleScore)) || 50, comment: String(a.coupleScoreReason || '') },
          group: { score: parseInt(String(a.groupScore)) || 50, comment: String(a.groupScoreReason || '') },
          solo: { score: parseInt(String(a.soloScore)) || 50, comment: String(a.soloScoreReason || '') },
          'digital-nomad': { score: parseInt(String(a.nomadScore)) || 50, comment: String(a.nomadScoreReason || '') },
        },
      },
      analysis: a,
      bookingLinks: generateBookingLinks(location),
    };

    // Save to Supabase + count rate limit
    await Promise.all([
      setCachedReport(cacheKey, locale, response),
      incrementRateLimit(ip),
    ]);

    return NextResponse.json(response);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Stay Check V2 error:', errMsg);
    return NextResponse.json(
      { error: 'Analysis failed: ' + errMsg.substring(0, 200) },
      { status: 500 }
    );
  }
}

function generateBookingLinks(locality: string) {
  const affiliateId = process.env.BOOKING_AFFILIATE_ID || 'YOUR_AFFILIATE_ID';
  const bookingParams = new URLSearchParams({
    aid: affiliateId, ss: `${locality}, Croatia`, lang: 'en',
  });
  return {
    booking: `https://www.booking.com/searchresults.html?${bookingParams.toString()}`,
    airbnb: `https://www.airbnb.com/s/${encodeURIComponent(locality + ', Croatia')}/homes`,
    apartmanija: `https://www.apartmanija.hr/pretraga?lokacija=${encodeURIComponent(locality)}`,
  };
}
