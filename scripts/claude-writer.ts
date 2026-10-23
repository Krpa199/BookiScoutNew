/**
 * English article generation with Claude Sonnet 5.5 + web search.
 *
 * A blind test on 2026-10-23 (5 topics, fact-checked) scored Sonnet with web
 * search 7.4/10 against 6.0 for Gemini Pro: it checks prices, hours and rules
 * before writing instead of writing from memory. Same prompt as Gemini
 * (buildPrompt), plus a research note.
 *
 * Two ways in:
 *   generateArticleClaude  — one article, normal API call
 *   writeArticlesBatch     — a day's articles through the Message Batches API
 *                            (half the token price; results usually within the hour)
 *
 * Key: ANTHROPIC_TRANSLATE_KEY (deliberately NOT ANTHROPIC_API_KEY, which
 * Claude Code would pick up). article-generator.ts falls back to Gemini when
 * this throws (no key, no credit, refusal, unusable output).
 */
import Anthropic from '@anthropic-ai/sdk';
import { buildPrompt, parseArticleResponse, ArticleData } from './gemini';
import { Destination, Theme } from '../src/config/destinations';

const MODEL = process.env.CLAUDE_WRITER_MODEL || 'claude-sonnet-5-5';
// $ per 1M tokens and per search, for the log line only. Batch halves tokens, not searches.
const PRICE = { in: 2, out: 10, search: 0.01 };

const RESEARCH_NOTE = `

RESEARCH: Before writing, use web search (at most 3 searches) to check current prices, opening times, schedules and rules, and that the specific places you plan to name really exist.
State facts directly. Do NOT mention sources, listings, guides, reviews or your research in the article ("was listed at", "sources say", "according to"), do NOT cite URLs, and never write citation tags.
CRITICAL: Your final answer must be ONLY the JSON object — nothing before "{" or after "}".`;

let client: Anthropic | null = null;
function getClient(): Anthropic {
  const key = process.env.ANTHROPIC_TRANSLATE_KEY;
  if (!key) throw new Error('ANTHROPIC_TRANSLATE_KEY is not set');
  client ??= new Anthropic({ apiKey: key });
  return client;
}

function baseParams(messages: any[]) {
  return {
    model: MODEL,
    max_tokens: 16000,
    messages,
    output_config: { effort: 'medium' },
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
  };
}

type Usage = { input: number; output: number; searches: number };

function addUsage(usage: Usage, u: any) {
  usage.input += u?.input_tokens || 0;
  usage.output += u?.output_tokens || 0;
  usage.searches += u?.server_tool_use?.web_search_requests || 0;
}

// Final message → article. Throws on anything the site can't publish.
function toArticle(message: any, usage: Usage, destination: Destination, theme: Theme, batch: boolean): ArticleData {
  if (message.stop_reason === 'refusal') throw new Error(`refusal: ${JSON.stringify(message.stop_details)}`);
  if (message.stop_reason === 'max_tokens') throw new Error('hit max_tokens');
  if (message.stop_reason === 'pause_turn') throw new Error('stopped mid-search (pause_turn)');

  // With search on, the answer arrives as several text blocks; the model also
  // sometimes writes (cite index="…"> tags into the text itself.
  const text = message.content
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('')
    .replace(/<cite[^>]*>/g, '')
    .replace(/<\/cite>/g, '');

  const article = parseArticleResponse(text, destination, theme, 'en');
  if (!article.quickAnswer || article.content.length < 800 || article.content.trimStart().startsWith('{')) {
    throw new Error('unusable output (no quick answer, too short or raw JSON)');
  }

  const tokens = (usage.input * PRICE.in + usage.output * PRICE.out) / 1e6;
  const cost = (batch ? tokens / 2 : tokens) + usage.searches * PRICE.search;
  const words = article.content.split(/\s+/).filter(Boolean).length;
  console.log(`  🤖 ${MODEL}${batch ? ' (batch)' : ''}: ${destination.slug}-${theme}, ${words} words, ${usage.searches} searches, ~$${cost.toFixed(3)}`);
  return article;
}

export async function generateArticleClaude(destination: Destination, theme: Theme): Promise<ArticleData> {
  const anthropic = getClient();
  const messages: any[] = [{ role: 'user', content: buildPrompt(destination, theme, 'English') + RESEARCH_NOTE }];
  const usage: Usage = { input: 0, output: 0, searches: 0 };
  let resp: any;
  // A server-tool turn can stop with pause_turn; resume it a few times.
  for (let turn = 0; turn < 4; turn++) {
    resp = await anthropic.beta.messages.create({
      ...baseParams(messages),
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
    } as any);
    addUsage(usage, resp.usage);
    if (resp.stop_reason !== 'pause_turn') break;
    messages.push({ role: 'assistant', content: resp.content });
  }
  return toArticle(resp, usage, destination, theme, false);
}

/**
 * Writes all topics in one Message Batch. Returns the articles that came back
 * usable, keyed "destination-theme"; anything missing (error, refusal,
 * pause_turn, timeout) is left for the caller's per-article fallback.
 * Never throws: a failed batch just returns an empty map.
 */
export async function writeArticlesBatch(
  topics: { destination: Destination; theme: Theme }[],
  maxMinutes = 120,
): Promise<Map<string, ArticleData>> {
  const done = new Map<string, ArticleData>();
  if (topics.length === 0) return done;
  try {
    const anthropic = getClient();
    // Fallbacks are not accepted by the Batches API, so refusals fall back per article later.
    const batch = await anthropic.messages.batches.create({
      requests: topics.map(({ destination, theme }) => ({
        custom_id: `${destination.slug}-${theme}`,
        params: baseParams([{ role: 'user', content: buildPrompt(destination, theme, 'English') + RESEARCH_NOTE }]) as any,
      })),
    });
    console.log(`\n📦 Claude batch ${batch.id}: ${topics.length} articles submitted`);

    const deadline = Date.now() + maxMinutes * 60_000;
    let status = batch;
    while (status.processing_status !== 'ended') {
      if (Date.now() > deadline) {
        console.log(`  ⚠️ Batch not finished after ${maxMinutes} min, cancelling; every article falls back`);
        await anthropic.messages.batches.cancel(batch.id).catch(() => {});
        return done;
      }
      await new Promise(resolve => setTimeout(resolve, 30_000));
      status = await anthropic.messages.batches.retrieve(batch.id);
    }

    const byId = new Map(topics.map(t => [`${t.destination.slug}-${t.theme}`, t]));
    for await (const result of await anthropic.messages.batches.results(batch.id)) {
      const topic = byId.get(result.custom_id);
      if (!topic) continue;
      if (result.result.type !== 'succeeded') {
        console.log(`  ⚠️ Batch ${result.custom_id}: ${result.result.type}`);
        continue;
      }
      try {
        const usage: Usage = { input: 0, output: 0, searches: 0 };
        addUsage(usage, result.result.message.usage);
        done.set(result.custom_id, toArticle(result.result.message, usage, topic.destination, topic.theme, true));
      } catch (error) {
        console.log(`  ⚠️ Batch ${result.custom_id}: ${(error as Error).message}`);
      }
    }
    console.log(`📦 Batch done: ${done.size}/${topics.length} usable\n`);
  } catch (error) {
    console.log(`  ⚠️ Claude batch failed (${(error as Error).message}); every article falls back`);
  }
  return done;
}
