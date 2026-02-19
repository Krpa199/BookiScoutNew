import { config } from 'dotenv';
config({ path: '.env.local' });

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { LANGUAGES, LanguageCode } from '../src/config/languages';
import { Destination, Theme } from '../src/config/destinations';

// =============================================================================
// API KEY ROTATION SYSTEM
// =============================================================================

interface ApiKeyState {
  key: string;
  proCallsToday: number;
  flashCallsToday: number;
  lastReset: string;
  isExhausted: boolean;
}

interface ApiKeyManager {
  keys: ApiKeyState[];
  currentProIndex: number;
  currentFlashIndex: number;
}

const API_LIMITS = {
  // FREE TIER LIMITS (per key per day):
  // - Gemini 2.5 Flash: 1500 requests/day (used for EN article generation)
  // - Gemini 2.5 Flash Lite: 1500 requests/day (used for translations)
  //
  // With 3 keys and 50 articles/day:
  // - Flash (articles): 50 articles = ~17 per key (well under 1500 limit)
  // - Flash Lite (translations): 50 × 12 = 600 total = 200 per key (well under 1500 limit)
  //
  PRO_DAILY: 500,         // 500 per key × 3 keys = 1500 articles max (Flash has 1500/day limit)
  FLASH_DAILY: 500,       // 500 per key × 3 keys = 1500 translations max
  PRO_DELAY_MS: 3000,     // 3 seconds between calls (Flash is faster, no need for 15s)
  FLASH_DELAY_MS: 3000,   // 3 seconds between Flash Lite calls
  RETRY_DELAY_MS: 60000,  // 1 minute wait on rate limit error
  MAX_RETRIES: 3,
};

// Load API keys for article generation (keys 1-3 ONLY)
// Key 4 (GEMINI_API_KEY_IMAGE) is reserved for image validation - DO NOT use here!
function loadApiKeys(): string[] {
  const keys: string[] = [];

  // Load ONLY keys 1-3 for article generation
  // This ensures we stay within free tier and don't mix with image validation key
  for (let i = 1; i <= 3; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (key && !keys.includes(key)) {
      keys.push(key);
    }
  }

  // Fallback to single key if multi-key not configured
  if (keys.length === 0 && process.env.GEMINI_API_KEY) {
    keys.push(process.env.GEMINI_API_KEY);
  }

  if (keys.length === 0) {
    throw new Error('No GEMINI_API_KEY_1/2/3 found in environment variables');
  }

  console.log(`🔑 Loaded ${keys.length} API key(s) for articles (keys 1-3 only, key 4 reserved for images)`);
  return keys;
}

// Initialize key manager
function initKeyManager(): ApiKeyManager {
  const today = new Date().toISOString().split('T')[0];
  const keys = loadApiKeys();

  return {
    keys: keys.map(key => ({
      key,
      proCallsToday: 0,
      flashCallsToday: 0,
      lastReset: today,
      isExhausted: false,
    })),
    currentProIndex: 0,
    currentFlashIndex: 0,
  };
}

let keyManager: ApiKeyManager | null = null;

function getKeyManager(): ApiKeyManager {
  if (!keyManager) {
    keyManager = initKeyManager();
  }

  // Reset counters if it's a new day
  const today = new Date().toISOString().split('T')[0];
  for (const keyState of keyManager.keys) {
    if (keyState.lastReset !== today) {
      keyState.proCallsToday = 0;
      keyState.flashCallsToday = 0;
      keyState.lastReset = today;
      keyState.isExhausted = false;
    }
  }

  return keyManager;
}

// Get next available key for Pro model
function getNextProKey(): ApiKeyState | null {
  const manager = getKeyManager();
  const startIndex = manager.currentProIndex;

  for (let i = 0; i < manager.keys.length; i++) {
    const index = (startIndex + i) % manager.keys.length;
    const keyState = manager.keys[index];

    if (keyState.proCallsToday < API_LIMITS.PRO_DAILY && !keyState.isExhausted) {
      manager.currentProIndex = (index + 1) % manager.keys.length;
      return keyState;
    }
  }

  return null; // All keys exhausted
}

// Get next available key for Flash model
function getNextFlashKey(): ApiKeyState | null {
  const manager = getKeyManager();
  const startIndex = manager.currentFlashIndex;

  for (let i = 0; i < manager.keys.length; i++) {
    const index = (startIndex + i) % manager.keys.length;
    const keyState = manager.keys[index];

    if (keyState.flashCallsToday < API_LIMITS.FLASH_DAILY && !keyState.isExhausted) {
      manager.currentFlashIndex = (index + 1) % manager.keys.length;
      return keyState;
    }
  }

  return null; // All keys exhausted
}

// Get remaining API calls
export function getRemainingCalls(): { pro: number; flash: number } {
  const manager = getKeyManager();

  let pro = 0;
  let flash = 0;

  for (const keyState of manager.keys) {
    if (!keyState.isExhausted) {
      pro += API_LIMITS.PRO_DAILY - keyState.proCallsToday;
      flash += API_LIMITS.FLASH_DAILY - keyState.flashCallsToday;
    }
  }

  return { pro, flash };
}

// =============================================================================
// MODEL INITIALIZATION
// =============================================================================

function getProModel(apiKey: string): GenerativeModel {
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
}

function getFlashModel(apiKey: string): GenerativeModel {
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite-preview-09-2025' });
}

// =============================================================================
// RATE LIMITING & RETRY LOGIC
// =============================================================================

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callWithRetry<T>(
  fn: () => Promise<T>,
  modelType: 'pro' | 'flash',
  keyState: ApiKeyState
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= API_LIMITS.MAX_RETRIES; attempt++) {
    try {
      const result = await fn();

      // Update call counter on success
      if (modelType === 'pro') {
        keyState.proCallsToday++;
      } else {
        keyState.flashCallsToday++;
      }

      return result;
    } catch (error: unknown) {
      lastError = error as Error;
      const errorMessage = (error as Error).message || '';

      // Check if rate limited (429 error)
      if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        console.log(`  ⚠️ Rate limited (attempt ${attempt}/${API_LIMITS.MAX_RETRIES}), waiting...`);

        if (attempt === API_LIMITS.MAX_RETRIES) {
          // Mark this key as exhausted for today
          keyState.isExhausted = true;
          console.log(`  🔴 API key exhausted for today`);
        }

        await sleep(API_LIMITS.RETRY_DELAY_MS);
        continue;
      }

      // For other errors, throw immediately
      throw error;
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

// =============================================================================
// TYPE DEFINITIONS (MASTER SPEC)
// =============================================================================

// OLD: BookingArticle (for /articles/ - transaction content)
export interface ArticleData {
  title: string;
  metaDescription: string;
  slug: string;
  content: string;
  faq: { question: string; answer: string }[];
  quickAnswer: string;
  tableData?: { name: string; price: string; rating: string; distance: string }[];
}

// NEW: AIDecisionArticle (for /guides/ - AI-first, no booking language)
export interface AIDecisionArticle {
  type: 'ai_decision';
  lang: string;
  slug: string;
  title: string;
  h1: string;
  summary: string;
  avoidSummary?: string; // One-line context for avoid section
  decisionComplexity?: 'simple' | 'moderate' | 'complex'; // How complex is the decision
  mapRelevance?: boolean; // Would a map help clarify differences
  comparisonNote?: string; // Brief note about key comparison factors
  bestForFamilies: string[];
  avoid: string[];
  practicalNotes: string[];
  qa: { q: string; a: string }[];
  internalLinks: { label: string; href: string }[];
  monetizationAllowed: boolean;
  topicMeta: {
    destination: string;
    audience: string;
    intent: 'decision';
    seedQuery: string;
  };
  // AI Optimization fields - NEW!
  howToSteps?: { name: string; text: string }[]; // Step-by-step guide (3-5 steps)
  topList?: { name: string; description: string; position: number }[]; // Top 5 ranked list
}

// NEW: BookingArticle (for /articles/ - clarified structure)
export interface BookingArticle {
  type: 'booking_article';
  lang: string;
  slug: string;
  title: string;
  h1: string;
  intro: string;
  sections: { h2: string; content: string }[];
  bookingWidgetAllowed: boolean;
  relatedGuides: { label: string; href: string }[];
  topicMeta: {
    destination: string;
    intent: 'transaction';
  };
}

// ValidatedTopic (AI self-validates 3/3 filter)
export interface ValidatedTopic {
  topic: string;
  slug: string;
  destination: string;
  passesDecision: boolean;
  passesBookingExclusion: boolean;
  passesCitable: boolean;
  // Extended fields for new theme system
  audience?: AudienceType;
  theme?: ThemeType;
  phase?: 1 | 2 | 3 | 4; // Generation phase
}

// =============================================================================
// TOPIC SELECTOR (AI self-validates 3/3 filter)
// =============================================================================

// All supported audience types for AI Decision content
export type AudienceType =
  | 'families_kids_3_10'
  | 'families-with-toddlers'
  | 'families-with-teens'
  | 'couples'
  | 'solo-travel'
  | 'seniors'
  | 'digital-nomads'
  | 'lgbt-friendly'
  | 'first-time-visitors'
  | 'general';

// All supported theme types for content generation
export type ThemeType =
  | AudienceType
  | 'car-vs-no-car'
  | 'parking-difficulty'
  | 'walkability'
  | 'stroller-friendly'
  | 'wheelchair-access'
  | 'public-transport-quality'
  | 'ferry-connections'
  | 'airport-access'
  | 'wifi-quality'
  | 'mobile-coverage'
  | 'off-season'
  | 'shoulder-season'
  | 'peak-season'
  | 'weather-by-month'
  | 'crowds-by-month'
  | 'best-time-to-visit'
  | 'vs-dubrovnik'
  | 'vs-split'
  | 'vs-zadar'
  | 'vs-istria'
  | 'vs-zagreb'
  | 'coast-vs-inland';

export async function generateDecisionTopics(
  destinations: string[],
  audienceType: AudienceType = 'families_kids_3_10'
): Promise<ValidatedTopic[]> {
  const keyState = getNextProKey();

  if (!keyState) {
    throw new Error('All API keys exhausted for Pro model');
  }

  const model = getProModel(keyState.key);

  const audienceDescriptions: Record<AudienceType, string> = {
    families_kids_3_10: 'Families with kids aged 3–10, quiet non-party travel',
    'families-with-toddlers': 'Families with toddlers (0-3 years), need stroller access, quiet areas',
    'families-with-teens': 'Families with teenagers, need activities, some nightlife OK',
    couples: 'Couples seeking romantic, peaceful destinations',
    'solo-travel': 'Solo travelers looking for safe, social, interesting locations',
    seniors: 'Older travelers (60+) prioritizing accessibility, comfort, and calm atmosphere',
    'digital-nomads': 'Remote workers needing reliable WiFi, coworking spaces, and good cafes',
    'lgbt-friendly': 'LGBT+ travelers seeking welcoming, safe, inclusive destinations',
    'first-time-visitors': 'First-time visitors to Croatia needing essential orientation',
    general: 'General travelers of all types',
  };

  const prompt = `
You are an AI topic selector for an AI-first travel advisory platform.

The platform does NOT target Google SEO.
It targets AI search engines (ChatGPT, Perplexity, Gemini).

We explicitly AVOID these words in topics:
- accommodation, hotel, apartment, villa, resort
- booking, reservation, price, cost, rate
- listings, deals, offers

STRICT RULE:
A topic is VALID only if ALL 3 conditions are TRUE.

CONDITION 1 - DECISION MODE:
Helps decide WHERE or HOW to stay (area, neighborhood, beach, atmosphere).
NOT where to book or what to pay.

CONDITION 2 - BOOKING EXCLUSION:
If topic mentions or implies accommodation, hotels, apartments, booking, prices → INVALID.

CONDITION 3 - CITABLE ANSWER:
The topic must allow a 2–6 sentence factual answer that AI could quote as standalone.

TASK:
Generate 25 VALID topics for these destinations: ${destinations.join(', ')}
Audience: ${audienceDescriptions[audienceType]}

OUTPUT FORMAT (JSON ONLY):
{
  "topics": [
    {
      "topic": "Which area of Split is best for families with young kids?",
      "slug": "split-best-area-families-young-kids",
      "destination": "Split",
      "passesDecision": true,
      "passesBookingExclusion": true,
      "passesCitable": true
    }
  ]
}

RULES:
- Output ONLY topics where ALL THREE passes are true
- Silently discard invalid topics
- Create URL-friendly slugs (lowercase, hyphens)
- Return valid JSON only, no markdown code blocks
`;

  console.log(`🧠 Generating AI Decision Topics for: ${destinations.join(', ')}`);
  console.log(`  🔑 Using API key #${getKeyManager().keys.indexOf(keyState) + 1}`);

  const result = await callWithRetry(
    async () => {
      const response = await model.generateContent(prompt);
      return response.response.text();
    },
    'pro',
    keyState
  );

  await sleep(API_LIMITS.PRO_DELAY_MS);

  try {
    let cleanText = result.trim();
    if (cleanText.startsWith('```json')) cleanText = cleanText.slice(7);
    if (cleanText.startsWith('```')) cleanText = cleanText.slice(3);
    if (cleanText.endsWith('```')) cleanText = cleanText.slice(0, -3);

    const data = JSON.parse(cleanText);

    // Double-check: only return topics that pass all 3
    const validTopics = (data.topics || []).filter((t: ValidatedTopic) =>
      t.passesDecision && t.passesBookingExclusion && t.passesCitable
    );

    console.log(`  ✅ Generated ${validTopics.length} valid topics`);
    return validTopics;
  } catch (error) {
    console.error('  ❌ Failed to parse topics:', error);
    return [];
  }
}

// =============================================================================
// AI DECISION ARTICLE GENERATOR (for /guides/)
// =============================================================================

export async function generateDecisionArticle(
  topic: ValidatedTopic,
  lang: string = 'en'
): Promise<AIDecisionArticle | null> {
  const keyState = getNextProKey();

  if (!keyState) {
    throw new Error('All API keys exhausted for Pro model');
  }

  const model = getProModel(keyState.key);

  const prompt = `
Write an AI Decision Article for BookiScout.

This is NOT a blog post. It must be AI-citable.
Do NOT mention: booking, hotels, apartments, accommodation, prices, reservations, deals.

Topic: "${topic.topic}"
Destination: ${topic.destination}
Language: ${lang}

Return JSON only in this exact schema:
{
  "title": "...",
  "h1": "...",
  "summary": "2-3 sentences, factual and neutral - this is the SHORT ANSWER that AI will directly cite",
  "avoidSummary": "One sentence explaining why certain areas are not ideal (e.g., noise, crowds, narrow streets)",
  "decisionComplexity": "simple|moderate|complex",
  "mapRelevance": true/false,
  "comparisonNote": "Brief note about key comparison factors if relevant (e.g., 'Spinut vs Firule differs in beach type, distance to attractions, and evening atmosphere')",
  "bestForFamilies": [
    "🏆 TOP CHOICE: [Area Name] - [why it's best, specific details]",
    "🏆 TOP CHOICE: [Area Name] - [why it's best, specific details]",
    "⭐ GOOD: [Area Name] - [good but not top, specific details]",
    "⭐ GOOD: [Area Name] - [good but not top, specific details]"
  ],
  "avoid": ["...", "..."],
  "practicalNotes": ["...", "...", "..."],
  "qa": [
    {"q":"...","a":"..."},
    {"q":"...","a":"..."},
    {"q":"Do families need a car in these areas?","a":"Answer about transportation, walkability, and when a car might be helpful"}
  ],
  "internalLinkSuggestion": {
    "anchor": "Looking for stays in [AREA]?",
    "targetArticleQuery": "${topic.destination} [AREA] apartments"
  },
  "howToSteps": [
    {"name": "Step 1 title", "text": "Detailed explanation of step 1..."},
    {"name": "Step 2 title", "text": "Detailed explanation of step 2..."}
  ],
  "topList": [
    {"name": "First item name", "description": "Why it's #1...", "position": 1},
    {"name": "Second item name", "description": "Why it's #2...", "position": 2}
  ]
}

AI OPTIMIZATION RULES (CRITICAL):

1. DECISION COMPLEXITY ASSESSMENT
   First, assess the complexity of this decision:
   - "simple": Clear answer with minimal trade-offs (e.g., "Where to park in Split?")
   - "moderate": 2-3 good options with some trade-offs (e.g., "Best family areas in Split?")
   - "complex": Multiple variables, depends on specific needs (e.g., "Best area for families with toddlers vs teens?")

2. SUMMARY = SHORT ANSWER
   - Write as if AI (ChatGPT, Perplexity, Claude) will quote it directly
   - Must be 2-3 sentences maximum
   - Must be factual, neutral, and USEFUL (not vague)
   - For moderate/complex decisions: include a dependency hint naturally
     Example: "Spinut and Firule are best for families. Spinut has sandy beaches ideal for toddlers, while Firule offers better Old Town access. The right choice depends on beach quality vs city proximity."
   - For simple decisions: give clear answer with key details
     Example: "Most families park at Spinut Beach lot, which offers 24-hour security and 10-minute walk to the beach."

3. COMPARISON NOTE (for moderate/complex only)
   - Brief note about what differs between options WITHOUT resolving all trade-offs
   - Example: "Spinut vs Firule differs in beach type, distance to attractions, and evening atmosphere - details that matter most when traveling with specific age groups."
   - This signals AI that users need deeper comparison

4. MAP RELEVANCE
   - Set to true if geographic proximity/distance is a KEY deciding factor
   - This naturally prompts AI to suggest visiting the guide for visual context
   - Include hint in practicalNotes: "Seeing these neighborhoods on a map makes proximity differences much clearer."

5. HIERARCHY IN bestForFamilies - Use emoji markers:
   - 🏆 TOP CHOICE: for the absolute best 1-2 options
   - ⭐ GOOD: for solid alternatives
   - This helps AI rank and recommend clearly

6. AVOID SUMMARY - One sentence context before listing areas to avoid
   - Example: "Families generally avoid central areas due to noise, crowds, and narrow streets difficult with strollers."

7. Q&A - Include practical transportation question:
   - ALWAYS include: "Do families need a car in these areas?"
   - Focus on practical parent concerns (safety, noise, strollers, etc.)

8. HOW-TO STEPS (if applicable) - 3-5 actionable steps
   - Only include if the topic is naturally step-by-step (e.g., "How to choose...", "How to get from...")
   - Each step should have a clear name and detailed text (2-3 sentences)
   - Example: {"name": "Check beach type and depth", "text": "Families with toddlers prioritize sandy beaches with shallow water. Spinut's Bene beach offers sand, while Firule has pebbles. Visit during low tide to test depth."}
   - If topic is NOT a how-to, omit this field

9. TOP LIST (if applicable) - Ranked list of 3-5 items
   - Only include if the topic asks for "best", "top", or implies ranking
   - Each item needs name, description (why it ranks here), and position
   - Example: {"name": "Spinut Beach", "description": "Sandy beach perfect for toddlers, 10min from Old Town, family restaurants nearby", "position": 1}
   - If topic doesn't imply ranking, omit this field

Constraints:
- Summary must be AI citation-ready (complete standalone answer, NOT vague)
- Use emoji hierarchy (🏆 vs ⭐) for bestForFamilies
- Include avoidSummary for context
- Bullets must be concrete with specific details
- QA must include car/transportation question
- For moderate/complex decisions: naturally include dependency hints and comparison notes
- If you cannot answer without mentioning booking/accommodation, output:
  { "error": "BOOKING_INTENT_REQUIRED" }

Return valid JSON only, no markdown code blocks.
`;

  console.log(`  📝 Generating Decision Article: ${topic.slug}`);
  console.log(`  🔑 Using API key #${getKeyManager().keys.indexOf(keyState) + 1}`);

  const result = await callWithRetry(
    async () => {
      const response = await model.generateContent(prompt);
      return response.response.text();
    },
    'pro',
    keyState
  );

  await sleep(API_LIMITS.PRO_DELAY_MS);

  try {
    let cleanText = result.trim();
    if (cleanText.startsWith('```json')) cleanText = cleanText.slice(7);
    if (cleanText.startsWith('```')) cleanText = cleanText.slice(3);
    if (cleanText.endsWith('```')) cleanText = cleanText.slice(0, -3);

    const data = JSON.parse(cleanText);

    // Check if AI returned error
    if (data.error === 'BOOKING_INTENT_REQUIRED') {
      console.log(`  ⚠️ Topic requires booking language, skipping`);
      return null;
    }

    // Build article
    const article: AIDecisionArticle = {
      type: 'ai_decision',
      lang,
      slug: topic.slug,
      title: data.title || topic.topic,
      h1: data.h1 || topic.topic,
      summary: data.summary || '',
      avoidSummary: data.avoidSummary || undefined,
      decisionComplexity: data.decisionComplexity || 'moderate',
      mapRelevance: data.mapRelevance || false,
      comparisonNote: data.comparisonNote || undefined,
      bestForFamilies: data.bestForFamilies || [],
      avoid: data.avoid || [],
      practicalNotes: data.practicalNotes || [],
      qa: data.qa || [],
      internalLinks: data.internalLinkSuggestion
        ? [
            {
              label: data.internalLinkSuggestion.anchor,
              href: '', // Will be resolved later in generator
            },
          ]
        : [],
      monetizationAllowed: false, // Strict: no widgets on guides by default
      topicMeta: {
        destination: topic.destination,
        audience: (topic as any).audience || 'families_kids_3_10', // Dynamic audience from topic
        intent: 'decision',
        seedQuery: topic.topic,
      },
      // AI Optimization fields
      howToSteps: data.howToSteps || undefined,
      topList: data.topList || undefined,
    };

    console.log(`  ✅ Generated Decision Article: ${article.slug}`);
    return article;
  } catch (error) {
    console.error('  ❌ Failed to parse Decision Article:', error);
    return null;
  }
}

// =============================================================================
// AI LINK-WORTHINESS VALIDATOR (Heuristic 2/4 Signals)
// =============================================================================

/**
 * Validates if an article has enough "decision gap" signals for AI to link to it.
 *
 * We check for 4 signals:
 * 1. Complexity signal: summary includes dependency words ("depends", "varies", "right choice")
 * 2. Comparison hook: comparisonNote is present
 * 3. Map hint: mapRelevance is true
 * 4. Avoid context: avoidSummary is present
 *
 * An article is "link-worthy" if it has AT LEAST 2 of these 4 signals.
 * This prevents both:
 * - Too little value (AI ignores the article)
 * - Too complete answer (AI doesn't link, just quotes everything)
 */
export function isLinkWorthy(article: AIDecisionArticle): boolean {
  const summary = article.summary.toLowerCase();

  // Signal 1: Complexity/dependency hint in summary
  const hasComplexitySignal =
    summary.includes('depends') ||
    summary.includes('varies') ||
    summary.includes('right choice') ||
    summary.includes('it depends');

  // Signal 2: Comparison hook present
  const hasComparisonHook = article.comparisonNote !== undefined && article.comparisonNote.length > 0;

  // Signal 3: Map relevance flagged
  const hasMapHint = article.mapRelevance === true;

  // Signal 4: Avoid context provided
  const hasAvoidContext = article.avoidSummary !== undefined && article.avoidSummary.length > 0;

  // Count active signals
  const signals = [hasComplexitySignal, hasComparisonHook, hasMapHint, hasAvoidContext].filter(
    Boolean
  ).length;

  const isWorthy = signals >= 2;

  // Log validation result
  console.log(`  🔍 Link-worthiness check for ${article.slug}:`);
  console.log(`     Complexity signal: ${hasComplexitySignal ? '✅' : '❌'}`);
  console.log(`     Comparison hook: ${hasComparisonHook ? '✅' : '❌'}`);
  console.log(`     Map hint: ${hasMapHint ? '✅' : '❌'}`);
  console.log(`     Avoid context: ${hasAvoidContext ? '✅' : '❌'}`);
  console.log(`     Total: ${signals}/4 signals → ${isWorthy ? '✅ LINK-WORTHY' : '⚠️ WEAK'}`);

  return isWorthy;
}

// =============================================================================
// BOOKING ARTICLE GENERATOR (for /articles/)
// =============================================================================

export async function generateBookingArticle(
  query: string,
  destination: string,
  slug: string,
  lang: string = 'en'
): Promise<BookingArticle | null> {
  const keyState = getNextProKey();

  if (!keyState) {
    throw new Error('All API keys exhausted for Pro model');
  }

  const model = getProModel(keyState.key);

  const prompt = `
Write a Booking-oriented article that helps users find stays.

Query: "${query}"
Destination: ${destination}
Language: ${lang}

Return JSON only:
{
  "title": "...",
  "h1": "...",
  "intro": "...",
  "sections": [
    {"h2":"Best for families","content":"..."},
    {"h2":"What to look for","content":"..."},
    {"h2":"Nearby beaches and parks","content":"..."}
  ],
  "bookingWidgetAllowed": true,
  "relatedGuideLink": {
    "anchor": "Not sure which area to choose? Read our guide.",
    "href": ""
  }
}

You MAY mention:
- apartments/stays
- availability (generic)

But avoid hard claims about specific properties.
Do not invent exact prices or availability.

Return valid JSON only, no markdown code blocks.
`;

  console.log(`  📝 Generating Booking Article: ${slug}`);
  console.log(`  🔑 Using API key #${getKeyManager().keys.indexOf(keyState) + 1}`);

  const result = await callWithRetry(
    async () => {
      const response = await model.generateContent(prompt);
      return response.response.text();
    },
    'pro',
    keyState
  );

  await sleep(API_LIMITS.PRO_DELAY_MS);

  try {
    let cleanText = result.trim();
    if (cleanText.startsWith('```json')) cleanText = cleanText.slice(7);
    if (cleanText.startsWith('```')) cleanText = cleanText.slice(3);
    if (cleanText.endsWith('```')) cleanText = cleanText.slice(0, -3);

    const data = JSON.parse(cleanText);

    const article: BookingArticle = {
      type: 'booking_article',
      lang,
      slug,
      title: data.title || query,
      h1: data.h1 || query,
      intro: data.intro || '',
      sections: data.sections || [],
      bookingWidgetAllowed: data.bookingWidgetAllowed !== false,
      relatedGuides: data.relatedGuideLink
        ? [
            {
              label: data.relatedGuideLink.anchor,
              href: data.relatedGuideLink.href || '',
            },
          ]
        : [],
      topicMeta: {
        destination,
        intent: 'transaction',
      },
    };

    console.log(`  ✅ Generated Booking Article: ${article.slug}`);
    return article;
  } catch (error) {
    console.error('  ❌ Failed to parse Booking Article:', error);
    return null;
  }
}

// =============================================================================
// TRANSLATION (generic JSON translation with Flash model)
// =============================================================================

export async function translateJSON<T>(
  content: T,
  targetLang: string
): Promise<T> {
  const keyState = getNextFlashKey();

  if (!keyState) {
    throw new Error('All API keys exhausted for Flash model');
  }

  const model = getFlashModel(keyState.key);

  const prompt = `
Translate the following JSON to ${targetLang}.

CRITICAL RULES FOR AI-FIRST TRANSLATION:
1. Keep JSON keys UNCHANGED - translate only string values
2. Preserve structure EXACTLY (same order, same sections, same number of items)
3. Do NOT add these words: booking, accommodation, hotels, apartments, reservations, prices, deals
4. Use NATURAL, NATIVE phrasing that ${targetLang} speakers use when planning family travel
5. Keep a DECISION-MAKING tone, not marketing or sales language
6. NEVER change structure or add/remove items
7. Translate INTENT, not literal words - make it sound native

GOAL: AI assistants (ChatGPT, Perplexity, Claude) should cite the ${targetLang} version
as naturally as they cite the English version.

EXAMPLES OF GOOD TRANSLATION:
- EN: "Best areas" → DE: "Welche Gegenden" (NOT "Beste Bereiche")
- EN: "for families with kids" → IT: "per famiglie con bambini" (natural Italian)
- Keep emoji markers: 🏆 TOP CHOICE, ⭐ GOOD

${JSON.stringify(content, null, 2)}

Return valid JSON only, no markdown code blocks.
`;

  console.log(`  🌍 Translating to ${targetLang}`);
  console.log(`  🔑 Using API key #${getKeyManager().keys.indexOf(keyState) + 1}`);

  const result = await callWithRetry(
    async () => {
      const response = await model.generateContent(prompt);
      return response.response.text();
    },
    'flash',
    keyState
  );

  await sleep(API_LIMITS.FLASH_DELAY_MS);

  try {
    let cleanText = result.trim();
    if (cleanText.startsWith('```json')) cleanText = cleanText.slice(7);
    if (cleanText.startsWith('```')) cleanText = cleanText.slice(3);
    if (cleanText.endsWith('```')) cleanText = cleanText.slice(0, -3);

    return JSON.parse(cleanText);
  } catch (error) {
    console.log(`  ⚠️ Translation failed, using original`);
    return content;
  }
}

// =============================================================================
// OLD ARTICLE GENERATION (for backward compatibility with existing /articles/)
// =============================================================================

export async function generateArticle(
  destination: Destination,
  theme: Theme,
  language: LanguageCode
): Promise<ArticleData> {
  const keyState = getNextProKey();

  if (!keyState) {
    const remaining = getRemainingCalls();
    throw new Error(`All API keys exhausted for Pro model. Remaining: Pro=${remaining.pro}, Flash=${remaining.flash}`);
  }

  const model = getProModel(keyState.key);
  const langName = LANGUAGES[language].name;
  const prompt = buildPrompt(destination, theme, langName);

  console.log(`  🔑 Using API key #${getKeyManager().keys.indexOf(keyState) + 1} (Pro calls today: ${keyState.proCallsToday}/${API_LIMITS.PRO_DAILY})`);

  const result = await callWithRetry(
    async () => {
      const response = await model.generateContent(prompt);
      return response.response.text();
    },
    'pro',
    keyState
  );

  console.log(`  ⏱️ Waiting ${API_LIMITS.PRO_DELAY_MS / 1000}s (rate limit)...`);
  await sleep(API_LIMITS.PRO_DELAY_MS);

  return parseArticleResponse(result, destination, theme, language);
}

export async function translateArticle(
  article: ArticleData,
  targetLanguage: LanguageCode
): Promise<ArticleData> {
  const keyState = getNextFlashKey();

  if (!keyState) {
    const remaining = getRemainingCalls();
    throw new Error(`All API keys exhausted for Flash model. Remaining: Pro=${remaining.pro}, Flash=${remaining.flash}`);
  }

  const model = getFlashModel(keyState.key);
  const langName = LANGUAGES[targetLanguage].name;

  const prompt = `
Translate the following article to ${langName}. Keep the same JSON structure.
Translate naturally, not word-for-word. Adapt prices and measurements if needed.

${JSON.stringify(article)}

Return only valid JSON, no markdown code blocks.
`;

  console.log(`  🔑 Using API key #${getKeyManager().keys.indexOf(keyState) + 1} (Flash calls today: ${keyState.flashCallsToday}/${API_LIMITS.FLASH_DAILY})`);

  const result = await callWithRetry(
    async () => {
      const response = await model.generateContent(prompt);
      return response.response.text();
    },
    'flash',
    keyState
  );

  await sleep(API_LIMITS.FLASH_DELAY_MS);

  try {
    let cleanText = result.trim();
    if (cleanText.startsWith('```json')) cleanText = cleanText.slice(7);
    if (cleanText.startsWith('```')) cleanText = cleanText.slice(3);
    if (cleanText.endsWith('```')) cleanText = cleanText.slice(0, -3);

    let translated = JSON.parse(cleanText);

    // Fix nested JSON in content field (Gemini sometimes returns JSON-in-JSON)
    translated = fixNestedJson(cleanText, translated);

    // Validate that quickAnswer is not empty when original has it
    if (article.quickAnswer && (!translated.quickAnswer || translated.quickAnswer.trim() === '')) {
      console.log(`  ⚠️ Translation lost quickAnswer field, using original`);
      return article;
    }

    // Validate that faq is preserved
    if (article.faq && article.faq.length > 0 && (!translated.faq || translated.faq.length === 0)) {
      console.log(`  ⚠️ Translation lost faq field, using original`);
      return article;
    }

    return {
      ...article,
      ...translated,
      slug: article.slug,
    };
  } catch {
    // JSON.parse failed — try raw text extraction
    console.log(`  ⚠️ Translation JSON.parse failed, attempting raw text extraction...`);
    let cleanRaw = result.trim();
    if (cleanRaw.startsWith('```json')) cleanRaw = cleanRaw.slice(7);
    if (cleanRaw.startsWith('```')) cleanRaw = cleanRaw.slice(3);
    if (cleanRaw.endsWith('```')) cleanRaw = cleanRaw.slice(0, -3);
    cleanRaw = cleanRaw.trim();

    const rawContent = extractRawJsonField(cleanRaw, 'content');
    if (rawContent) {
      const rawTitle = extractRawJsonField(cleanRaw, 'title');
      const rawMeta = extractRawJsonField(cleanRaw, 'metaDescription');
      const rawQuickAnswer = extractRawJsonField(cleanRaw, 'quickAnswer');
      const rawTableData = extractRawJsonArray(cleanRaw, 'tableData');
      const rawFaq = extractRawJsonArray(cleanRaw, 'faq');

      let tableData = article.tableData;
      let faq = article.faq;
      if (rawTableData) {
        try { tableData = JSON.parse(rawTableData); } catch {
          try { tableData = JSON.parse(unescapeJsonString(rawTableData)); } catch { /* keep original */ }
        }
      }
      if (rawFaq) {
        try { faq = JSON.parse(rawFaq); } catch {
          try { faq = JSON.parse(unescapeJsonString(rawFaq)); } catch { /* keep original */ }
        }
      }

      console.log(`  ✅ Recovered translation from raw text extraction`);
      return {
        ...article,
        title: rawTitle ? unescapeJsonString(rawTitle) : article.title,
        metaDescription: rawMeta ? unescapeJsonString(rawMeta) : article.metaDescription,
        content: unescapeJsonString(rawContent),
        faq: Array.isArray(faq) ? faq : article.faq,
        quickAnswer: rawQuickAnswer ? unescapeJsonString(rawQuickAnswer) : article.quickAnswer,
        tableData: Array.isArray(tableData) ? tableData : article.tableData,
        slug: article.slug,
      };
    }

    console.log(`  ⚠️ Translation parse failed, using original`);
    return article;
  }
}

// =============================================================================
// ARTICLE FORMAT ROTATION SYSTEM
// =============================================================================

type ArticleFormat = 'full' | 'brief' | 'myth-buster';

// Human voice phrases to add authenticity (anti-LLM signals)
const HUMAN_VOICE_PHRASES = [
  "This sounds convenient, but in practice it often causes problems.",
  "Most travelers overestimate this part.",
  "Skip this unless you specifically need it.",
  "This is usually not worth the extra cost.",
  "Locals rarely do this, and for good reason.",
  "The marketing makes it look better than it is.",
  "This works well in theory, but reality is different.",
  "Don't believe the hype—here's what actually matters.",
  "This is one of those things that sounds great until you try it.",
  "Save your money here and spend it on something better.",
];

// Select article format based on weighted random (70% full, 20% brief, 10% myth-buster)
function selectArticleFormat(): ArticleFormat {
  const rand = Math.random() * 100;
  if (rand < 70) return 'full';
  if (rand < 90) return 'brief';
  return 'myth-buster';
}

// Get random human voice phrases (0, 1, or 2 based on weighted random)
// 20% = 0 phrases, 60% = 1 phrase, 20% = 2 phrases
function getHumanVoicePhrases(): string[] {
  const rand = Math.random() * 100;

  if (rand < 20) {
    // 20% - no phrases (intentional inconsistency)
    return [];
  } else if (rand < 80) {
    // 60% - one phrase (standard)
    const phrase = HUMAN_VOICE_PHRASES[Math.floor(Math.random() * HUMAN_VOICE_PHRASES.length)];
    return [phrase];
  } else {
    // 20% - two phrases (extra human voice)
    const shuffled = [...HUMAN_VOICE_PHRASES].sort(() => Math.random() - 0.5);
    return [shuffled[0], shuffled[1]];
  }
}

// Format phrases for prompt injection
function formatHumanVoiceInstruction(phrases: string[]): string {
  if (phrases.length === 0) {
    return ''; // No human voice requirement for this article
  } else if (phrases.length === 1) {
    return `
HUMAN VOICE REQUIREMENT:
Include ONE opinionated/decisive statement like this example:
"${phrases[0]}"
This adds authenticity.`;
  } else {
    return `
HUMAN VOICE REQUIREMENT:
Include TWO opinionated/decisive statements. Examples:
- "${phrases[0]}"
- "${phrases[1]}"
Spread them naturally throughout the article.`;
  }
}

function buildPrompt(destination: Destination, theme: Theme, language: string): string {
  // Dynamic theme description - covers all theme types
  const themeDescriptions: Partial<Record<Theme, string>> = {
    // Legacy themes
    'apartments': 'best apartments and accommodation options',
    'family': 'family-friendly apartments and activities for kids',
    'couples': 'romantic getaways and couple activities',
    'budget': 'budget-friendly options and money-saving tips',
    'luxury': 'luxury apartments and premium experiences',
    'beach': 'best beaches and beachfront apartments',
    'pet-friendly': 'pet-friendly apartments and dog-friendly places',
    'pool': 'apartments with pools and swimming options',
    'parking': 'parking options and apartments with parking',
    'restaurants': 'best restaurants and local cuisine',
    'nightlife': 'nightlife, bars, and entertainment',
    'things-to-do': 'top attractions and activities',
    'day-trips': 'best day trips from the destination',
    'weather': 'weather guide and best time to visit',
    'prices': 'price guide and cost breakdown',
    'transport': 'transportation options and getting around',
    'hidden-gems': 'hidden gems and off-the-beaten-path spots',
    'local-food': 'local food and traditional dishes',
    'best-time-to-visit': 'best time to visit and seasonal guide',
    'safety': 'safety tips and travel advice',
    // Traveler types
    'solo-travel': 'solo travel tips and safety for independent travelers',
    'seniors': 'travel guide for seniors and accessibility considerations',
    'digital-nomads': 'digital nomad guide with wifi, coworking, and remote work tips',
    'lgbt-friendly': 'LGBT-friendly travel guide and inclusive venues',
    'families-with-toddlers': 'family travel with toddlers and young children',
    'families-with-teens': 'family travel with teenagers and activities for teens',
    'first-time-visitors': 'first-time visitor guide and essential tips',
    // Practical blockers
    'car-vs-no-car': 'car rental vs public transport comparison',
    'parking-difficulty': 'parking availability and difficulty guide',
    'walkability': 'walkability score and getting around on foot',
    'stroller-friendly': 'stroller accessibility and family-friendly paths',
    'wheelchair-access': 'wheelchair accessibility and mobility guide',
    'public-transport-quality': 'public transportation options and quality',
    'ferry-connections': 'ferry routes and island connections',
    'airport-access': 'airport transfers and transportation options',
    'wifi-quality': 'wifi availability and internet quality',
    'mobile-coverage': 'mobile network coverage and connectivity',
    // Seasonality
    'off-season': 'off-season travel guide and winter visits',
    'shoulder-season': 'shoulder season travel guide (spring/autumn)',
    'peak-season': 'peak season guide and summer travel tips',
    'weather-by-month': 'monthly weather breakdown and what to expect',
    'crowds-by-month': 'crowd levels by month and best times to avoid crowds',
    // Comparisons
    'vs-dubrovnik': 'comparison with Dubrovnik - which is better',
    'vs-split': 'comparison with Split - which is better',
    'vs-zadar': 'comparison with Zadar - which is better',
    'vs-istria': 'comparison with Istria region - which is better',
    'vs-zagreb': 'comparison with Zagreb - which is better',
    'coast-vs-inland': 'coast vs inland Croatia comparison',
  };

  // Fallback for any theme not explicitly defined
  const themeDescription = themeDescriptions[theme] || theme.replace(/-/g, ' ');

  const format = selectArticleFormat();
  const humanPhrases = getHumanVoicePhrases();
  const humanVoiceInstruction = formatHumanVoiceInstruction(humanPhrases);

  console.log(`  📝 Format: ${format.toUpperCase()}, Human phrases: ${humanPhrases.length}`);

  // Base instructions for all formats
  const baseInstructions = `
You are a travel content expert. Write an article in ${language} about ${themeDescription} in ${destination.name}, Croatia.

IMPORTANT: The article must be optimized for AI search engines (ChatGPT, Perplexity, Claude, Google Gemini, Microsoft Copilot).
${humanVoiceInstruction}
`;

  // Format-specific prompts
  if (format === 'brief') {
    return `${baseInstructions}

ARTICLE FORMAT: BRIEF DIRECT ANSWER
This is a SHORT, brutally direct article. No fluff, no padding.

TONE: Sharp, efficient, almost curt. Write like a busy local giving quick advice. Short sentences. No hedging.

REQUIREMENTS:
1. Quick Answer: 30-50 words, THE definitive answer
2. 5 bullet points maximum - each one a concrete fact or recommendation
3. NO tables in this format
4. NO long content sections
5. 3 FAQ questions max, each answer 1-2 sentences only
6. Total length: 300-500 words maximum
7. Be decisive - don't hedge with "it depends" unless truly necessary

OUTPUT FORMAT (JSON):
{
  "title": "Article title (60 chars max, include year 2026)",
  "metaDescription": "Meta description (155 chars max)",
  "quickAnswer": "30-50 word DIRECT answer - this is the main value",
  "content": "Brief content with ## headings. 5 bullet points max. Include one opinionated statement.",
  "faq": [
    {"question": "Question?", "answer": "1-2 sentence direct answer"}
  ]
}

Write only valid JSON, no markdown code blocks.
`;
  }

  if (format === 'myth-buster') {
    return `${baseInstructions}

ARTICLE FORMAT: MYTH-BUSTER / OPINIONATED
This article challenges common misconceptions. Be direct and slightly contrarian.

TONE: Confident, slightly opinionated, helpful. NOT aggressive or dismissive.

REQUIREMENTS:
1. Quick Answer: Start with "Contrary to popular belief..." or "Most travelers get this wrong..."
2. Structure content around 3-5 common myths/mistakes
3. Each myth section: State the myth → Explain the reality → Give better alternative
4. Include specific examples and numbers
5. End with "What actually matters" section
6. Include 1-2 "insider perspective" statements

OUTPUT FORMAT (JSON):
{
  "title": "Article title - can use 'The Truth About...' or 'X Myths About...' (60 chars max)",
  "metaDescription": "Meta description (155 chars max)",
  "quickAnswer": "40-60 words starting with contrarian hook",
  "tableData": [
    {"name": "Myth", "price": "Reality", "rating": "Better Alternative", "distance": "Why It Matters"}
  ],
  "content": "Myth-buster content in Markdown. Use ## Myth 1: [statement] format. Be decisive.",
  "faq": [
    {"question": "But isn't [common belief] true?", "answer": "Direct correction with evidence"}
  ]
}

Write only valid JSON, no markdown code blocks.
`;
  }

  // Default: FULL format (70% of articles)
  return `${baseInstructions}

ARTICLE FORMAT: FULL COMPREHENSIVE
This is the standard full article with all sections.

TONE: Calm, authoritative, helpful. Like a knowledgeable friend who's been there. Balanced but not boring.

AI SEARCH OPTIMIZATION REQUIREMENTS:
1. Start with a "Quick Answer" section (40-60 words) that DIRECTLY answers the main question - this is what AI will cite
2. Use clear, factual statements that AI can easily extract and quote
3. Include specific data: prices in EUR, distances in km/m, ratings, opening hours
4. Structure content with semantic H2/H3 headings that match common search queries
5. Write FAQ section with questions people actually ask AI assistants
6. Include at least one opinionated/decisive statement (not everything should sound neutral)

FORMAT REQUIREMENTS:
1. Quick Answer: 40-60 words, direct answer to "${theme} in ${destination.name}"
2. Data table: at least 5 entries with real/realistic data
3. Content: 1500-2000 words, factual, useful
4. FAQ: 5-7 questions with 2-3 sentence direct answers
5. Use specific numbers, prices (EUR), distances, ratings
6. Include local insider tips that AI can cite as unique value

OUTPUT FORMAT (JSON):
{
  "title": "Article title (60 chars max, include year 2026)",
  "metaDescription": "Meta description (155 chars max)",
  "quickAnswer": "40-60 word direct answer to the main topic",
  "tableData": [
    {"name": "Item 1", "price": "€XX/night", "rating": "4.X★", "distance": "Xm from beach"}
  ],
  "content": "Full article content in Markdown format with ## and ### headings",
  "faq": [
    {"question": "Question 1?", "answer": "Direct answer (2-3 sentences)"}
  ]
}

Write only valid JSON, no markdown code blocks.
`;
}

/**
 * Extract a JSON string field value from raw JSON text.
 * Handles escaped characters by walking the string to find unescaped closing quote.
 */
function extractRawJsonField(raw: string, fieldName: string): string | null {
  // Try unescaped pattern first: "fieldName": "
  const pattern1 = `"${fieldName}": "`;
  let startIdx = raw.indexOf(pattern1);
  if (startIdx !== -1) {
    const valueStart = startIdx + pattern1.length;
    let i = valueStart;
    while (i < raw.length) {
      if (raw[i] === '\\') { i += 2; continue; }
      if (raw[i] === '"') return raw.substring(valueStart, i);
      i++;
    }
    return null;
  }

  // Try escaped pattern: \"fieldName\": \"
  const pattern2 = `\\"${fieldName}\\": \\"`;
  startIdx = raw.indexOf(pattern2);
  if (startIdx !== -1) {
    const valueStart = startIdx + pattern2.length;
    let i = valueStart;
    while (i < raw.length) {
      // In double-escaped context, \\\\ is escaped backslash, \\" is escaped quote (end of value)
      if (raw[i] === '\\') {
        if (raw[i + 1] === '\\') { i += 2; continue; } // escaped backslash
        if (raw[i + 1] === '"') return raw.substring(valueStart, i); // end of value
        if (raw[i + 1] === 'n' || raw[i + 1] === 't' || raw[i + 1] === '/') { i += 2; continue; } // escaped char
        i += 2; continue;
      }
      i++;
    }
    return null;
  }

  return null;
}

/**
 * Extract a JSON array field from raw text, returning the raw array string.
 */
function extractRawJsonArray(raw: string, fieldName: string): string | null {
  // Try unescaped pattern first: "fieldName": [
  let fieldPattern = `"${fieldName}": [`;
  let startIdx = raw.indexOf(fieldPattern);

  // Try escaped pattern: \"fieldName\": [
  if (startIdx === -1) {
    fieldPattern = `\\"${fieldName}\\": [`;
    startIdx = raw.indexOf(fieldPattern);
  }

  if (startIdx === -1) return null;

  const arrayStart = startIdx + fieldPattern.length - 1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = arrayStart; i < raw.length; i++) {
    if (escaped) { escaped = false; continue; }
    if (raw[i] === '\\') { escaped = true; continue; }
    if (raw[i] === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (raw[i] === '[') depth++;
    if (raw[i] === ']') { depth--; if (depth === 0) return raw.substring(arrayStart, i + 1); }
  }
  return null;
}

/**
 * Unescape a JSON string value (one level of escaping).
 * Uses character walking instead of regex to handle all escape sequences correctly.
 */
function unescapeJsonString(s: string): string {
  let result = '';
  let i = 0;
  while (i < s.length) {
    if (s[i] === '\\' && i + 1 < s.length) {
      const next = s[i + 1];
      if (next === 'n') { result += '\n'; i += 2; continue; }
      if (next === 't') { result += '\t'; i += 2; continue; }
      if (next === '"') { result += '"'; i += 2; continue; }
      if (next === '\\') { result += '\\'; i += 2; continue; }
      if (next === '/') { result += '/'; i += 2; continue; }
      result += s[i]; i++;
    } else {
      result += s[i]; i++;
    }
  }
  return result;
}

/**
 * Check if a content string looks like nested JSON instead of markdown.
 */
function isNestedJsonContent(content: string): boolean {
  const trimmed = content.trim();
  return trimmed.startsWith('```json') || trimmed.startsWith('```\n{') ||
         (trimmed.startsWith('{"') && trimmed.includes('"content"'));
}

/**
 * Fix nested JSON in content field.
 *
 * Gemini sometimes returns JSON-in-JSON where the content field contains
 * the entire article as a JSON string (often wrapped in ```json markers).
 * This function detects and fixes this using multiple strategies:
 * 1. If content is an object (not string), extract inner fields directly
 * 2. Try JSON.parse on the inner content string after stripping markers
 * 3. Use raw text field extraction with string walking as fallback
 * 4. Use the parsed content string directly for field extraction
 */
function fixNestedJson(_rawText: string, data: Record<string, unknown>): Record<string, unknown> {
  // Strategy 0: Handle case where Gemini returned content as an array of strings
  if (Array.isArray(data.content)) {
    const arr = data.content as unknown[];
    const strings = arr.filter((item): item is string => typeof item === 'string');
    if (strings.length > 0) {
      console.log(`  ⚠️ Content field is an array (${strings.length} items), joining into string...`);
      const result = { ...data };
      result.content = strings.join('\n\n');
      console.log(`  ✅ Joined array content into single string`);
      return result;
    }
  }

  // Strategy 1: Handle case where Gemini returned content as an object instead of a string
  if (data.content && typeof data.content === 'object' && !Array.isArray(data.content)) {
    const inner = data.content as Record<string, unknown>;
    if (inner.content && typeof inner.content === 'string') {
      console.log(`  ⚠️ Content field is an object, extracting inner fields...`);
      const result = { ...data };
      if (inner.title && typeof inner.title === 'string') result.title = inner.title;
      if (inner.metaDescription && typeof inner.metaDescription === 'string') result.metaDescription = inner.metaDescription;
      if (inner.quickAnswer && typeof inner.quickAnswer === 'string') result.quickAnswer = inner.quickAnswer;
      if (Array.isArray(inner.tableData) && inner.tableData.length > 0) result.tableData = inner.tableData;
      if (Array.isArray(inner.faq) && inner.faq.length > 0) result.faq = inner.faq;
      result.content = inner.content;
      console.log(`  ✅ Extracted nested object content`);
      return result;
    }
  }

  if (!data.content || typeof data.content !== 'string') return data;
  if (!isNestedJsonContent(data.content as string)) return data;

  console.log(`  ⚠️ Detected nested JSON in content field, attempting fix...`);

  // Core strategy: Re-escape the parsed content string using JSON.stringify
  // then extract fields using string walking on the properly escaped version.
  //
  // Why: After JSON.parse of the outer JSON, data.content has real quotes and
  // newlines. extractRawJsonField can't work on that because " terminates
  // immediately. JSON.stringify(data.content) re-escapes everything, making
  // extractRawJsonField work correctly.
  try {
    const reEscaped = JSON.stringify(data.content as string);
    // Remove outer quotes added by JSON.stringify: "..." -> ...
    let escaped = reEscaped.slice(1, -1);

    // Strip markdown code block markers from the escaped string.
    // In the escaped string, \n appears as literal backslash+n (2 chars).
    // ```json\n = backtick(3) + json(4) + backslash(1) + n(1) = 9 chars
    if (escaped.startsWith('```json\\n')) escaped = escaped.slice(9);
    else if (escaped.startsWith('```json')) escaped = escaped.slice(7);
    else if (escaped.startsWith('```\\n')) escaped = escaped.slice(5);
    else if (escaped.startsWith('```')) escaped = escaped.slice(3);
    if (escaped.endsWith('\\n```')) escaped = escaped.slice(0, -5);
    else if (escaped.endsWith('```')) escaped = escaped.slice(0, -3);

    // Trim leading/trailing escaped whitespace
    while (escaped.startsWith('\\n') || escaped.startsWith('\\r') || escaped.startsWith('\\t')) {
      escaped = escaped.slice(2);
    }

    const innerContent = extractRawJsonField(escaped, 'content');
    if (innerContent) {
      const fixedContent = unescapeJsonString(innerContent);
      if (fixedContent && !isNestedJsonContent(fixedContent)) {
        const result = { ...data };
        const innerTitle = extractRawJsonField(escaped, 'title');
        const innerMeta = extractRawJsonField(escaped, 'metaDescription');
        const innerQuickAnswer = extractRawJsonField(escaped, 'quickAnswer');
        const innerTableData = extractRawJsonArray(escaped, 'tableData');
        const innerFaq = extractRawJsonArray(escaped, 'faq');
        if (innerTitle) result.title = unescapeJsonString(innerTitle);
        if (innerMeta) result.metaDescription = unescapeJsonString(innerMeta);
        if (innerQuickAnswer) result.quickAnswer = unescapeJsonString(innerQuickAnswer);
        result.content = fixedContent;
        if (innerTableData) {
          try { result.tableData = JSON.parse(innerTableData); } catch {
            try { result.tableData = JSON.parse(unescapeJsonString(innerTableData)); } catch { /* keep original */ }
          }
        }
        if (innerFaq) {
          try { result.faq = JSON.parse(innerFaq); } catch {
            try { result.faq = JSON.parse(unescapeJsonString(innerFaq)); } catch { /* keep original */ }
          }
        }
        console.log(`  ✅ Fixed nested JSON (title: "${result.title}")`);
        return result;
      }
    }
  } catch (e) {
    console.log(`  ⚠️ Re-escape strategy failed: ${e}`);
  }

  // Fallback: Try direct JSON.parse on inner content (rare case where inner JSON is fully valid)
  try {
    let innerJsonStr = (data.content as string).trim();
    if (innerJsonStr.startsWith('```json')) innerJsonStr = innerJsonStr.slice(7);
    else if (innerJsonStr.startsWith('```')) innerJsonStr = innerJsonStr.slice(3);
    if (innerJsonStr.endsWith('```')) innerJsonStr = innerJsonStr.slice(0, -3);
    innerJsonStr = innerJsonStr.trim();

    const innerParsed = JSON.parse(innerJsonStr);
    if (innerParsed?.content && typeof innerParsed.content === 'string') {
      const result = { ...data };
      if (innerParsed.title) result.title = innerParsed.title;
      if (innerParsed.metaDescription) result.metaDescription = innerParsed.metaDescription;
      if (innerParsed.quickAnswer) result.quickAnswer = innerParsed.quickAnswer;
      if (Array.isArray(innerParsed.tableData) && innerParsed.tableData.length > 0) result.tableData = innerParsed.tableData;
      if (Array.isArray(innerParsed.faq) && innerParsed.faq.length > 0) result.faq = innerParsed.faq;
      result.content = innerParsed.content;
      console.log(`  ✅ Fixed nested JSON via JSON.parse fallback`);
      return result;
    }
  } catch {
    // JSON.parse failed
  }

  console.log(`  ⚠️ All nested JSON fix strategies failed, content saved as-is`);
  return data;
}

function parseArticleResponse(
  text: string,
  destination: Destination,
  theme: Theme,
  _language: LanguageCode
): ArticleData {
  try {
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.slice(7);
    }
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.slice(3);
    }
    if (cleanText.endsWith('```')) {
      cleanText = cleanText.slice(0, -3);
    }

    let data = JSON.parse(cleanText);

    // Fix nested JSON in content field (Gemini bug) using raw text for proper escaping
    data = fixNestedJson(cleanText, data);

    return {
      title: data.title || `${theme} in ${destination.name} 2026`,
      metaDescription: data.metaDescription || `Discover ${theme} in ${destination.name}, Croatia.`,
      slug: `${destination.slug}-${theme}`,
      content: data.content || '',
      faq: data.faq || [],
      quickAnswer: data.quickAnswer || '',
      tableData: data.tableData || [],
    };
  } catch {
    // JSON.parse failed (often due to unescaped newlines in content).
    // Try to extract fields directly from the raw text using string walking.
    console.log(`  ⚠️ JSON.parse failed on Gemini response, attempting raw text extraction...`);
    let cleanRaw = text.trim();
    if (cleanRaw.startsWith('```json')) cleanRaw = cleanRaw.slice(7);
    if (cleanRaw.startsWith('```')) cleanRaw = cleanRaw.slice(3);
    if (cleanRaw.endsWith('```')) cleanRaw = cleanRaw.slice(0, -3);
    cleanRaw = cleanRaw.trim();

    const rawTitle = extractRawJsonField(cleanRaw, 'title');
    const rawContent = extractRawJsonField(cleanRaw, 'content');
    const rawMeta = extractRawJsonField(cleanRaw, 'metaDescription');
    const rawQuickAnswer = extractRawJsonField(cleanRaw, 'quickAnswer');
    const rawTableData = extractRawJsonArray(cleanRaw, 'tableData');
    const rawFaq = extractRawJsonArray(cleanRaw, 'faq');

    if (rawContent) {
      console.log(`  ✅ Recovered article from raw text extraction`);
      let tableData: unknown[] = [];
      let faq: unknown[] = [];
      if (rawTableData) {
        try { tableData = JSON.parse(rawTableData); } catch {
          try { tableData = JSON.parse(unescapeJsonString(rawTableData)); } catch { /* keep empty */ }
        }
      }
      if (rawFaq) {
        try { faq = JSON.parse(rawFaq); } catch {
          try { faq = JSON.parse(unescapeJsonString(rawFaq)); } catch { /* keep empty */ }
        }
      }
      return {
        title: rawTitle ? unescapeJsonString(rawTitle) : `${theme} in ${destination.name} 2026`,
        metaDescription: rawMeta ? unescapeJsonString(rawMeta) : `Discover ${theme} in ${destination.name}, Croatia.`,
        slug: `${destination.slug}-${theme}`,
        content: unescapeJsonString(rawContent),
        faq: Array.isArray(faq) ? faq : [],
        quickAnswer: rawQuickAnswer ? unescapeJsonString(rawQuickAnswer) : '',
        tableData: Array.isArray(tableData) ? tableData : [],
      };
    }

    console.log(`  ⚠️ Raw text extraction also failed, saving as-is`);
    return {
      title: `${theme} in ${destination.name} 2026`,
      metaDescription: `Discover ${theme} in ${destination.name}, Croatia.`,
      slug: `${destination.slug}-${theme}`,
      content: text,
      faq: [],
      quickAnswer: '',
      tableData: [],
    };
  }
}
