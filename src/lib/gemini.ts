import { GoogleGenerativeAI } from '@google/generative-ai';
import { LANGUAGES, LanguageCode } from '@/config/languages';
import { Destination, Theme } from '@/config/destinations';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

export interface ArticleData {
  title: string;
  metaDescription: string;
  slug: string;
  content: string;
  faq: { question: string; answer: string }[];
  quickAnswer: string;
  tableData?: { name: string; price: string; rating: string; distance: string }[];
}

export async function generateArticle(
  destination: Destination,
  theme: Theme,
  language: LanguageCode
): Promise<ArticleData> {
  const langName = LANGUAGES[language].name;
  const prompt = buildPrompt(destination, theme, langName);

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  return parseArticleResponse(text, destination, theme, language);
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

IMPORTANT: The article must be optimized for AI search engines (ChatGPT, Perplexity, Claude).

FORMAT REQUIREMENTS:
1. Start with a "Quick Answer" section (40-60 words) that directly answers the main question
2. Include a data table with at least 5 entries (if applicable)
3. Write 1500-2000 words of useful, factual content
4. Include 5-7 FAQ questions with direct answers
5. Use specific numbers, prices (in EUR), and statistics
6. Structure with clear H2 and H3 headings
7. Include local insider tips

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

export async function translateArticle(
  article: ArticleData,
  targetLanguage: LanguageCode
): Promise<ArticleData> {
  const langName = LANGUAGES[targetLanguage].name;

  const prompt = `
Translate the following article to ${langName}. Keep the same JSON structure.
Translate naturally, not word-for-word. Adapt prices and measurements if needed.

${JSON.stringify(article)}

Return only valid JSON, no markdown code blocks.
`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  try {
    let cleanText = text.trim();
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
    return article; // Return original if translation fails
  }
}
