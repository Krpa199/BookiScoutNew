/**
 * English article generation with Claude Sonnet 5.5 + web search.
 *
 * A blind test on 2026-10-23 (5 topics, fact-checked) scored Sonnet with web
 * search 7.4/10 against 6.0 for Gemini Pro: it checks prices, hours and rules
 * before writing instead of writing from memory. Same prompt as Gemini
 * (buildPrompt), plus a research note.
 *
 * Key: ANTHROPIC_TRANSLATE_KEY (deliberately NOT ANTHROPIC_API_KEY, which
 * Claude Code would pick up). article-generator.ts falls back to Gemini when
 * this throws (no key, no credit, refusal, unusable output).
 */
import Anthropic from '@anthropic-ai/sdk';
import { buildPrompt, parseArticleResponse, ArticleData } from './gemini';
import { Destination, Theme } from '../src/config/destinations';

const MODEL = process.env.CLAUDE_WRITER_MODEL || 'claude-sonnet-5-5';
// $ per 1M tokens and per search, for the log line only.
const PRICE = { in: 2, out: 10, search: 0.01 };

const RESEARCH_NOTE = `

RESEARCH: Before writing, use web search (at most 3 searches) to check current prices, opening times, schedules and rules, and that the specific places you plan to name really exist.
State facts directly. Do NOT mention sources, listings, guides, reviews or your research in the article ("was listed at", "sources say", "according to"), do NOT cite URLs, and never write citation tags.
CRITICAL: Your final answer must be ONLY the JSON object — nothing before "{" or after "}".`;

let client: Anthropic | null = null;

export async function generateArticleClaude(destination: Destination, theme: Theme): Promise<ArticleData> {
  const key = process.env.ANTHROPIC_TRANSLATE_KEY;
  if (!key) throw new Error('ANTHROPIC_TRANSLATE_KEY is not set');
  client ??= new Anthropic({ apiKey: key });

  const messages: any[] = [{ role: 'user', content: buildPrompt(destination, theme, 'English') + RESEARCH_NOTE }];
  const usage = { input: 0, output: 0, searches: 0 };
  let resp: any;
  // A server-tool turn can stop with pause_turn; resume it a few times.
  for (let turn = 0; turn < 4; turn++) {
    resp = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      messages,
      output_config: { effort: 'medium' },
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
    } as any);
    usage.input += resp.usage?.input_tokens || 0;
    usage.output += resp.usage?.output_tokens || 0;
    usage.searches += resp.usage?.server_tool_use?.web_search_requests || 0;
    if (resp.stop_reason !== 'pause_turn') break;
    messages.push({ role: 'assistant', content: resp.content });
  }
  if (resp.stop_reason === 'refusal') throw new Error(`refusal: ${JSON.stringify(resp.stop_details)}`);
  if (resp.stop_reason === 'max_tokens') throw new Error('hit max_tokens');

  // With search on, the answer arrives as several text blocks; the model also
  // sometimes writes <cite index="…"> tags into the text itself.
  const text = resp.content
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('')
    .replace(/<cite[^>]*>/g, '')
    .replace(/<\/cite>/g, '');

  const article = parseArticleResponse(text, destination, theme, 'en');
  if (!article.quickAnswer || article.content.length < 800 || article.content.trimStart().startsWith('{')) {
    throw new Error('unusable output (no quick answer, too short or raw JSON)');
  }

  const cost = (usage.input * PRICE.in + usage.output * PRICE.out) / 1e6 + usage.searches * PRICE.search;
  const words = article.content.split(/\s+/).filter(Boolean).length;
  console.log(`  🤖 ${MODEL}: ${words} words, ${usage.searches} searches, ~$${cost.toFixed(3)}`);
  return article;
}
