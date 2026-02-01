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
  PRO_DAILY: 25,      // Gemini 2.5 Pro free tier limit per key
  FLASH_DAILY: 1500,  // Gemini 2.0 Flash Lite free tier limit per key
  PRO_DELAY_MS: 15000,    // 15 seconds between Pro calls (5 RPM = 12s min)
  FLASH_DELAY_MS: 3000,   // 3 seconds between Flash calls (30 RPM)
  RETRY_DELAY_MS: 60000,  // 1 minute wait on rate limit error
  MAX_RETRIES: 3,
};

// Load all API keys from environment
function loadApiKeys(): string[] {
  const keys: string[] = [];

  // Support both old single key and new multi-key format
  if (process.env.GEMINI_API_KEY) {
    keys.push(process.env.GEMINI_API_KEY);
  }

  // Load numbered keys (GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.)
  for (let i = 1; i <= 10; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (key && !keys.includes(key)) {
      keys.push(key);
    }
  }

  if (keys.length === 0) {
    throw new Error('No GEMINI_API_KEY found in environment variables');
  }

  console.log(`🔑 Loaded ${keys.length} API key(s)`);
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
  return genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
}

function getFlashModel(apiKey: string): GenerativeModel {
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
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
        theme: (topic as any).theme || undefined, // Theme for practical blockers/seasonality
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

    const translated = JSON.parse(cleanText);
    return {
      ...article,
      ...translated,
      slug: article.slug,
    };
  } catch {
    console.log(`  ⚠️ Translation parse failed, using original`);
    return article;
  }
}

function buildPrompt(destination: Destination, theme: Theme, language: string): string {
  const themeDescriptions: Record<Theme, string> = {
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
  };

  return `
You are a travel content expert. Write an article in ${language} about ${themeDescriptions[theme]} in ${destination.name}, Croatia.

IMPORTANT: The article must be optimized for AI search engines (ChatGPT, Perplexity, Claude, Google Gemini, Microsoft Copilot).

AI SEARCH OPTIMIZATION REQUIREMENTS:
1. Start with a "Quick Answer" section (40-60 words) that DIRECTLY answers the main question - this is what AI will cite
2. Use clear, factual statements that AI can easily extract and quote
3. Include specific data: prices in EUR, distances in km/m, ratings, opening hours
4. Structure content with semantic H2/H3 headings that match common search queries
5. Write FAQ section with questions people actually ask AI assistants

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

    const data = JSON.parse(cleanText);

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
