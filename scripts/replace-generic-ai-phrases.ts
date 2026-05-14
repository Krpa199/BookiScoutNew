/**
 * Replaces top-10 generic "purple-prose" AI phrases with neutral alternatives.
 * EN-focused (these are signature English LLM phrases). Other languages are mostly machine-translated
 * from EN so direct EN replacement covers the bulk; we also handle a few obvious literal translations.
 *
 * The replacements are conservative — they pick one neutral synonym per phrase rather than rotating,
 * so the result is consistent and readable. The cost is some sentences sounding slightly dull;
 * the upside is that LLM-classifier signature words go away cleanly.
 *
 * Run: npx tsx scripts/replace-generic-ai-phrases.ts [--dry-run] [--lang=en] [--limit=N]
 */
import fs from 'fs';
import path from 'path';

type Article = {
  content?: string;
  faq?: Array<{ question: string; answer: string }>;
  quickAnswer?: { answer?: string; [k: string]: unknown };
  metaDescription?: string;
  title?: string;
  [k: string]: unknown;
};

// Phrase replacements per language. Order matters — longer phrases first.
const REPLACEMENTS: Record<string, Array<[RegExp, string]>> = {
  en: [
    // Longer phrases first
    [/\bhas cemented itself as\b/gi, 'has established itself as'],
    [/\bcemented itself as\b/gi, 'established itself as'],
    [/\bshimmering Adriatic\b/gi, 'clear Adriatic'],
    [/\bcrystal-clear Adriatic\b/gi, 'clear Adriatic'],
    [/\bpulsating seaside\b/gi, 'lively seaside'],
    [/\ba tapestry of\b/gi, 'a mix of'],
    [/\bthe tapestry of\b/gi, 'the mix of'],
    [/\bsymphony of\b/gi, 'mix of'],
    [/\bunparalleled\b/gi, 'exceptional'],
    [/\bbreathtaking\b/gi, 'stunning'],
    [/\b(?:truly\s+)?magical\b/gi, 'charming'],
    [/\benchanting\b/gi, 'charming'],
    [/\b(?:nestled|tucked away)\b/gi, 'located'],
    [/\bpulsating\b/gi, 'lively'],
    [/\bbustling tapestry\b/gi, 'lively mix'],
    [/\bpremier destination\b/gi, 'top destination'],
    [/\bidyllic escape\b/gi, 'quiet escape'],
    [/\bplethora of\b/gi, 'many'],
    [/\bmyriad of\b/gi, 'many'],
    [/\b(?:gem|jewel) of\b/gi, 'highlight of'],
  ],
  // Other languages: only the very obvious mechanical translations of EN superlatives
  hr: [
    [/\bblistavom Jadranu\b/gi, 'bistrom Jadranu'],
    [/\bblistav[ai]\s+jadran/gi, 'bistar jadran'],
    [/\bneusporediv[ai]?\b/gi, 'izvrstan'],
  ],
  de: [
    [/\bunvergleichlich(?:en?|er)?\b/gi, 'außergewöhnlich'],
    [/\bglitzernde[nr]?\s+Adria\b/gi, 'klaren Adria'],
  ],
  it: [
    [/\bineguagliabil[ei]\b/gi, 'eccezionale'],
    [/\bscintillante\s+Adriatico\b/gi, 'limpido Adriatico'],
  ],
  fr: [
    [/\binégalé(?:e|s)?\b/gi, 'exceptionnel'],
    [/\bAdriatique\s+scintillante?\b/gi, 'Adriatique limpide'],
  ],
  es: [
    [/\binigualabl[ei]\b/gi, 'excepcional'],
    [/\bAdriático\s+resplandeciente\b/gi, 'Adriático cristalino'],
  ],
  pl: [
    [/\bniezrównan[ye]?[a-z]*\b/gi, 'wyjątkowy'],
  ],
  nl: [
    [/\bongeëvenaard[e]?\b/gi, 'uitzonderlijk'],
  ],
  cz: [
    [/\bnesrovnatelný\b/gi, 'výjimečný'],
  ],
  sk: [
    [/\bneprekonateľn[ýá]\b/gi, 'výnimočný'],
  ],
  sl: [
    [/\bneprimerljiv[oa]?\b/gi, 'izjemen'],
  ],
  hu: [
    [/\bpáratlan\b/gi, 'kivételes'],
  ],
  ru: [
    [/\bнесравненн[ыойаыи][а-я]*\b/gi, 'выдающийся'],
    [/\bсверкающ[еиа][а-я]*\s+Адриатик/gi, 'кристально чистая Адриатика'],
  ],
};

function applyReplacements(text: string, lang: string): { newText: string; count: number } {
  if (!text) return { newText: text, count: 0 };
  let count = 0;
  let result = text;
  const patterns = REPLACEMENTS[lang] || [];
  // Always also apply EN patterns — non-EN articles often have leftover EN snippets
  const allPatterns = lang === 'en' ? patterns : [...patterns, ...REPLACEMENTS.en];
  for (const [pat, rep] of allPatterns) {
    result = result.replace(pat, () => {
      count++;
      return rep;
    });
  }
  return { newText: result, count };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const langArg = args.find(a => a.startsWith('--lang='))?.split('=')[1];
  const limitArg = args.find(a => a.startsWith('--limit='))?.split('=')[1];
  const limit = limitArg ? parseInt(limitArg, 10) : Infinity;

  const root = path.join(process.cwd(), 'src', 'content', 'articles');
  const langs = langArg ? [langArg] : fs.readdirSync(root).filter(l =>
    fs.statSync(path.join(root, l)).isDirectory()
  );

  let totalFiles = 0;
  let filesChanged = 0;
  let totalReplacements = 0;
  const samples: string[] = [];

  for (const lang of langs) {
    const dir = path.join(root, lang);
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

    let langReplacements = 0;
    let langFilesChanged = 0;

    for (const file of files) {
      if (totalFiles >= limit) break;
      totalFiles++;
      const filepath = path.join(dir, file);
      try {
        const raw = fs.readFileSync(filepath, 'utf-8');
        const article: Article = JSON.parse(raw);
        let fileChanges = 0;

        // Replace in content
        if (article.content) {
          const r = applyReplacements(article.content, lang);
          if (r.count > 0) {
            article.content = r.newText;
            fileChanges += r.count;
          }
        }
        // Replace in metaDescription
        if (article.metaDescription) {
          const r = applyReplacements(article.metaDescription, lang);
          if (r.count > 0) {
            article.metaDescription = r.newText;
            fileChanges += r.count;
          }
        }
        // Replace in title
        if (article.title) {
          const r = applyReplacements(article.title, lang);
          if (r.count > 0) {
            article.title = r.newText;
            fileChanges += r.count;
          }
        }
        // Replace in faq
        if (Array.isArray(article.faq)) {
          for (const f of article.faq) {
            const rQ = applyReplacements(f.question, lang);
            if (rQ.count > 0) { f.question = rQ.newText; fileChanges += rQ.count; }
            const rA = applyReplacements(f.answer, lang);
            if (rA.count > 0) { f.answer = rA.newText; fileChanges += rA.count; }
          }
        }
        // Replace in quickAnswer
        if (article.quickAnswer && typeof article.quickAnswer.answer === 'string') {
          const r = applyReplacements(article.quickAnswer.answer, lang);
          if (r.count > 0) { article.quickAnswer.answer = r.newText; fileChanges += r.count; }
        }

        if (fileChanges > 0) {
          langReplacements += fileChanges;
          totalReplacements += fileChanges;
          langFilesChanged++;
          filesChanged++;
          if (samples.length < 3 && lang === 'en') {
            samples.push(`${lang}/${file}: ${fileChanges} replacements`);
          }
          if (!dryRun) {
            fs.writeFileSync(filepath, JSON.stringify(article, null, 2), 'utf-8');
          }
        }
      } catch (err) {
        console.error(`Error in ${lang}/${file}:`, (err as Error).message);
      }
    }
    if (langFilesChanged > 0) {
      console.log(`[${lang}] ${langFilesChanged} files changed, ${langReplacements} replacements`);
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Files scanned:        ${totalFiles}`);
  console.log(`Files changed:        ${filesChanged}`);
  console.log(`Total replacements:   ${totalReplacements}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'WRITTEN'}`);
}

main().catch(err => { console.error(err); process.exit(1); });
