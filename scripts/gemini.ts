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
// ARTICLE DATA INTERFACE
// =============================================================================

export interface ArticleData {
  title: string;
  metaDescription: string;
  slug: string;
  content: string;
  faq: { question: string; answer: string }[];
  quickAnswer: string;
  tableData?: { name: string; price: string; rating: string; distance: string }[];
}

// =============================================================================
// ARTICLE GENERATION (uses Gemini 2.5 Pro for quality)
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

  // Add delay after Pro call
  console.log(`  ⏱️ Waiting ${API_LIMITS.PRO_DELAY_MS / 1000}s (rate limit)...`);
  await sleep(API_LIMITS.PRO_DELAY_MS);

  return parseArticleResponse(result, destination, theme, language);
}

// =============================================================================
// TRANSLATION (uses Gemini 2.0 Flash Lite for speed/cost)
// =============================================================================

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

  // Add delay after Flash call
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
      slug: article.slug, // Keep original slug
    };
  } catch {
    console.log(`  ⚠️ Translation parse failed, using original`);
    return article; // Return original if translation fails
  }
}

// =============================================================================
// PROMPT BUILDING
// =============================================================================

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

// =============================================================================
// RESPONSE PARSING
// =============================================================================

function parseArticleResponse(
  text: string,
  destination: Destination,
  theme: Theme,
  language: LanguageCode
): ArticleData {
  try {
    // Clean up response - remove markdown code blocks if present
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
    // Fallback if JSON parsing fails
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
