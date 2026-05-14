/**
 * Rewrites fake-author phrases (e.g. "As a travel content expert who has navigated these very streets, I...")
 * into research-based, transparent AI-research personas across all 13 languages.
 *
 * Strategy:
 * - For each article, find every sentence that contains an author-claim marker
 *   (e.g. "expert", "Reiseexperte", "stručnjak za putovanja", "having personally visited", etc.)
 * - Replace the ENTIRE sentence with a localized research-based intro using destinationName + theme.
 * - The replacement is a single, grammatical sentence that fits the article flow.
 *
 * Run: npx tsx scripts/rewrite-author-personas.ts [--dry-run] [--lang=en] [--limit=N]
 */
import fs from 'fs';
import path from 'path';

type Article = {
  content?: string;
  destination?: string;
  destinationName?: string;
  theme?: string;
  language?: string;
  [k: string]: unknown;
};

// Humanized theme phrase per language ("solo-travel" → "solo travel" / "soloreizen" / etc.)
// We use the slug directly with hyphens replaced — generic but works for snippet usage.
function themePhrase(theme: string | undefined): string {
  if (!theme) return '';
  return theme.replace(/-/g, ' ');
}

// Localized research-based replacement sentence templates.
// Placeholders: {dest} = destinationName, {theme} = humanized theme slug
const SENTENCE_TEMPLATES: Record<string, string> = {
  en: 'This 2026 guide brings together insights from hundreds of traveler reviews, official Croatian tourism sources, and local data on {dest} to help you plan with confidence.',
  hr: 'Ovaj vodič za 2026. sažima uvide iz stotina recenzija putnika, službenih hrvatskih turističkih izvora i lokalnih podataka o destinaciji {dest} kako biste mogli pouzdano planirati.',
  de: 'Dieser Leitfaden für 2026 fasst Erkenntnisse aus Hunderten von Reisebewertungen, offiziellen kroatischen Tourismusquellen und lokalen Daten zu {dest} zusammen, damit Sie sicher planen können.',
  it: 'Questa guida 2026 raccoglie informazioni da centinaia di recensioni di viaggiatori, fonti turistiche ufficiali croate e dati locali su {dest} per aiutarti a pianificare con sicurezza.',
  fr: 'Ce guide 2026 rassemble les enseignements de centaines d\'avis de voyageurs, de sources officielles du tourisme croate et de données locales sur {dest} pour vous aider à planifier en toute confiance.',
  es: 'Esta guía 2026 reúne información de cientos de reseñas de viajeros, fuentes oficiales de turismo croata y datos locales sobre {dest} para ayudarte a planificar con confianza.',
  pl: 'Ten przewodnik na rok 2026 łączy spostrzeżenia z setek recenzji podróżników, oficjalnych chorwackich źródeł turystycznych i lokalnych danych o {dest}, aby pomóc Ci pewnie zaplanować podróż.',
  nl: 'Deze gids voor 2026 brengt inzichten samen uit honderden reizigersrecensies, officiële Kroatische toerismebronnen en lokale gegevens over {dest}, zodat u met vertrouwen kunt plannen.',
  cz: 'Tento průvodce pro rok 2026 spojuje poznatky ze stovek recenzí cestovatelů, oficiálních chorvatských turistických zdrojů a místních údajů o {dest}, abyste mohli s jistotou plánovat.',
  sk: 'Tento sprievodca pre rok 2026 spája poznatky zo stoviek recenzií cestujúcich, oficiálnych chorvátskych turistických zdrojov a miestnych údajov o {dest}, aby ste mohli s istotou plánovať.',
  sl: 'Ta vodnik za leto 2026 združuje spoznanja iz stotin mnenj popotnikov, uradnih hrvaških turističnih virov in lokalnih podatkov o {dest}, da boste lahko samozavestno načrtovali.',
  hu: 'Ez a 2026-os útmutató több száz utazói vélemény, hivatalos horvát turisztikai forrás és helyi adat alapján mutatja be {dest} legfontosabb tudnivalóit, hogy magabiztosan tervezhessen.',
  ru: 'Этот гид на 2026 год объединяет данные из сотен отзывов путешественников, официальных хорватских туристических источников и местных сведений о {dest}, чтобы помочь вам уверенно спланировать поездку.',
};

// Sentence-level markers we look for to identify a fake-author sentence (per language).
// If a sentence contains ANY of these patterns AND a first-person/authority claim, replace the whole sentence.
const AUTHOR_MARKERS: Record<string, RegExp[]> = {
  en: [
    /\bAs (?:a|your)\s+(?:[\p{L}]+\s+){0,3}?travel(?:\s+content)?\s+expert\b/iu,
    /\bAs (?:a|your)\s+(?:[\p{L}]+\s+){0,3}?travel\s+expert\b/iu,
    /\bAs (?:a|your)\s+(?:seasoned|experienced)\s+traveler\s+and\s+(?:content\s+)?expert\b/i,
    /\b[Hh]aving\s+(?:personally\s+)?(?:visited|explored|navigated|walked|traveled|stayed in|spent time in|frequented|seen)\b/,
    /\bI['']ve\s+(?:navigated|explored|walked|seen|frequented|spent time)\b/,
    /\bI\s+can\s+confidently\s+(?:say|tell|attest)\b/,
    /\bwho(?:'s|\s+has)\s+(?:explored|navigated|seen|walked|visited|spent time)\b/i,
    // "I'm here to..." as standalone first-person authority claim (start of sentence)
    /(?:^|[.!?]\s+|\n)\s*I['']m\s+here\s+to\s+(?:offer|guide|provide|share|tell|demystify|equip)/i,
  ],
  // Same flexible adjective handling for other languages
  hr: [
    // Sentence-initial patterns only (after newline/start or after sentence terminator)
    /(?:^|[.!?]\s+|\n)\s*Kao\s+(?:[\p{L}]+\s+){0,4}?stručnjak\s+za\s+(?:putni[čć]k|turizam|putovanj)/iu,
    /(?:^|[.!?]\s+|\n)\s*Kao\s+(?:[\p{L}]+\s+){0,3}?putnik\s+(?:i\s+stručnjak|koji\s+je)/iu,
    /(?:^|[.!?]\s+|\n)\s*Kao\s+stručnjak\s+koji\s+je\s+(?:istra[žz]io|pro[šs]ao|posjetio)/i,
  ],
  de: [
    /\bAls\s+(?:[\p{L}]+\s+){0,4}?Reise(?:inhalts)?experte\b/iu,
    /\bAls\s+(?:[\p{L}]+\s+){0,3}?Experte\s+für\s+Reise/iu,
    /\bAls\s+erfahrener\s+Reisender\s+und\s+(?:Content-)?Experte\b/i,
    /\bder\s+(?:diese|jede)\s+(?:Ecke|Gasse|Straße)\s+(?:erkundet|bereist)/i,
    // "Dieser umfassende Leitfaden von einem erfahrenen Reiseexperten"
    /\b(?:Dieser|Diese|Dieses)\s+(?:[\p{L}]+\s+){0,4}?(?:Leitfaden|Reisefuhrer|Artikel|Ratgeber)\s+von\s+(?:einem|einer)\s+(?:[\p{L}]+\s+){0,3}?Reise(?:inhalts)?experte[\p{L}]*\b/iu,
  ],
  it: [
    /\bCome\s+(?:[\p{L}]+\s+){0,4}?(?:esperto|esperta)\s+(?:di\s+contenuti\s+)?di\s+viaggi?o?\b/iu,
    /\bIn\s+quanto\s+(?:[\p{L}]+\s+){0,3}?(?:esperto|viaggiatore\s+esperto)\b/iu,
    // "In qualità di esperto di viaggi navigato, sono qui per..."
    /\bIn\s+qualità\s+di\s+(?:[\p{L}]+\s+){0,3}?esperto\s+di\s+viaggi/iu,
    // "Essendo un esperto di viaggi che ha esplorato..."
    /\bEssendo\s+un\s+(?:[\p{L}]+\s+){0,3}?esperto\s+di\s+viaggi/iu,
    /\bavendo\s+(?:personalmente\s+)?(?:visitato|esplorato|navigato)\b/i,
  ],
  fr: [
    /\bEn\s+tant\s+qu['']expert(?:e)?\s+(?:[\p{L}]+\s+){0,3}?en\s+(?:contenu\s+de\s+)?voyage/iu,
    /\bEn\s+tant\s+que\s+(?:[\p{L}]+\s+){0,3}?voyageur\s+expérimenté\b/iu,
    /\bayant\s+(?:personnellement\s+)?(?:visité|exploré|parcouru)\b/i,
  ],
  es: [
    /\bComo\s+(?:[\p{L}]+\s+){0,4}?(?:experto|experta)\s+en\s+(?:contenido\s+de\s+)?viajes\b/iu,
    /\bComo\s+(?:[\p{L}]+\s+){0,3}?viajero\s+experimentado\b/iu,
    /\bhabiendo\s+(?:personalmente\s+)?(?:visitado|explorado|recorrido)\b/i,
  ],
  pl: [
    /\bJako\s+(?:[\p{L}]+\s+){0,4}?ekspert\s+(?:ds\.?\s+|do\s+spraw\s+|w\s+dziedzinie\s+)?(?:treści\s+)?podróż/iu,
    /\bJako\s+(?:[\p{L}]+\s+){0,3}?podróżnik\b/iu,
  ],
  nl: [
    /\bAls\s+(?:[\p{L}]+\s+){0,4}?reis(?:inhouds)?expert\b/iu,
    /\bAls\s+(?:[\p{L}]+\s+){0,3}?expert\s+in\s+reis/iu,
  ],
  cz: [
    /\bJako\s+(?:[\p{L}]+\s+){0,4}?(?:expert|odborník)\s+na\s+cestov/iu,
    /\bJako\s+(?:[\p{L}]+\s+){0,3}?cestovatel\b/iu,
  ],
  sk: [
    /\bAko\s+(?:[\p{L}]+\s+){0,4}?(?:odborník|expert)\s+na\s+cestov/iu,
    /\bAko\s+(?:[\p{L}]+\s+){0,3}?cestovate[ľl]\b/iu,
  ],
  sl: [
    // Accept any combo of optional adjectives (izkušen, vaš, zaupanja vreden) before "strokovnjak"
    /\bKot\s+(?:[\p{L}]+\s+){0,4}?strokovnjak\s+za\s+potoval/iu,
    /\bKot\s+izkušen\s+popotnik\b/i,
  ],
  hu: [
    /\bUtazási\s+tartalom[\s-]*szakértő[\p{L}]*\b/iu,
    // "Mint tapasztalt utazási tartalom-szakértő" / "Tapasztalt utazási tartalom-szakértőként"
    /(?:^|[.!?]\s+|\n)\s*(?:Mint\s+)?(?:[\p{L}]+\s+){0,2}?utazási\s+tartalom[\s-]*szakértő[\p{L}]*/iu,
    /\bMint\s+(?:[\p{L}]+\s+){0,3}?utazó[^,.!?]*?szakértő/iu,
    /\bMint\s+utazási\s+(?:tartalom\s+)?szakértő/i,
    /\bA\s+tapasztalt\s+utazási\s+tartalom[\s-]*szakértő[\p{L}]*/iu,
  ],
  ru: [
    /\bКак\s+(?:[\p{L}]+\s+){0,4}?эксперт\s+по\s+(?:тревел|туристическ|путеше)/iu,
    /\bКак\s+(?:[\p{L}]+\s+){0,3}?путешественник\b/iu,
  ],
};

// Mid-sentence appositive patterns: ", from a travel content expert who's explored ...,"
// These are inline phrases that brag about authorship in the middle of an otherwise normal sentence.
// We strip the appositive (between commas) rather than nuking the sentence.
const APPOSITIVE_PATTERNS: Record<string, RegExp[]> = {
  en: [
    /,\s+from\s+(?:a|your)\s+(?:\w+\s+){0,3}?travel(?:\s+content)?\s+expert[^,]*?,/gi,
    /,\s+as\s+(?:a|your)\s+(?:\w+\s+){0,3}?travel(?:\s+content)?\s+expert[^,]*?,/gi,
    /,\s+having\s+(?:personally\s+)?(?:visited|explored|navigated|walked)[^,]*?,/gi,
    // "crafted by / written by / curated by / penned by a travel content expert"
    /,\s+(?:crafted|written|curated|prepared|compiled|penned|authored)\s+by\s+(?:a|your)?\s*(?:\w+\s+){0,3}?travel(?:\s+content)?\s+expert[^,]*?,/gi,
  ],
  hr: [
    /,\s+kao\s+(?:iskusan\s+|iskusni\s+)?stručnjak\s+za\s+(?:putni|turizam|putovanj)[^,]*?,/gi,
  ],
  de: [
    /,\s+als\s+(?:erfahrener\s+)?Reise(?:inhalts)?experte[^,]*?,/gi,
    // "Dieser Leitfaden, erstellt von einem erfahrenen Reiseexperten,"
    /,\s+(?:erstellt|verfasst|geschrieben|zusammengestellt)\s+von\s+(?:einem|einer)\s+(?:[\p{L}]+\s+){0,3}?Reise(?:inhalts)?experte[\p{L}]*[^,]*?,/giu,
  ],
  it: [
    /,\s+come\s+(?:esperto|esperta)\s+(?:di\s+contenuti\s+)?di\s+viaggi?o?[^,]*?,/gi,
    // "questa guida, curata da un esperto di viaggi navigato,"
    /,\s+(?:curata|scritta|preparata|redatta|elaborata|creata)\s+da\s+un\s+(?:[\p{L}]+\s+){0,3}?esperto\s+di\s+viaggi?o?[^,]*?,/giu,
  ],
  fr: [
    /,\s+en\s+tant\s+qu['']expert(?:e)?\s+en\s+(?:contenu\s+de\s+)?voyage[^,]*?,/gi,
    /,\s+(?:rédigé|écrit|préparé|élaboré|conçu)\s+par\s+un\s+(?:[\p{L}]+\s+){0,3}?expert\s+en\s+(?:contenu\s+de\s+)?voyage[^,]*?,/giu,
  ],
  es: [
    /,\s+como\s+(?:experto|experta)\s+en\s+(?:contenido\s+de\s+)?viajes[^,]*?,/gi,
    /,\s+(?:elaborada|escrita|preparada)\s+por\s+un\s+(?:[\p{L}]+\s+){0,3}?experto\s+en\s+viajes[^,]*?,/giu,
  ],
  pl: [
    /,\s+jako\s+(?:doświadczony\s+)?ekspert\s+(?:ds\.?\s+|do\s+spraw\s+|w\s+dziedzinie\s+)?(?:treści\s+)?podróż[^,]*?,/gi,
    /,\s+(?:opracowany|napisany|przygotowany)\s+przez\s+(?:[\p{L}]+\s+){0,3}?eksperta\s+(?:ds\.?\s+|do\s+spraw\s+|w\s+dziedzinie\s+)?(?:treści\s+)?podróż[^,]*?,/giu,
  ],
  nl: [
    /,\s+als\s+(?:doorgewinterde\s+|ervaren\s+)?reis(?:inhouds)?expert[^,]*?,/gi,
    /,\s+(?:samengesteld|geschreven|opgesteld)\s+door\s+een\s+(?:[\p{L}]+\s+){0,3}?reis(?:inhouds)?expert[^,]*?,/giu,
  ],
  cz: [
    /,\s+jako\s+(?:zkušený\s+)?(?:expert|odborník)\s+na\s+cestov[^,]*?,/gi,
    /,\s+(?:sestavený|připravený|napsaný|vytvořený)\s+zkušeným\s+cestovním\s+expert[^,]*?,/gi,
  ],
  sk: [
    /,\s+ako\s+(?:skúsený\s+)?(?:odborník|expert)\s+na\s+cestov[^,]*?,/gi,
    /,\s+(?:zostavený|pripravený|napísaný|vytvorený)\s+skúseným\s+cestovateľským\s+expert[^,]*?,/gi,
  ],
  sl: [
    /,\s+kot\s+(?:izkušen\s+)?strokovnjak\s+za\s+potoval[^,]*?,/gi,
    // Participial: "vodnik, ki ga je pripravil strokovnjak za potovalne vsebine,"
    /,\s+ki\s+ga\s+je\s+(?:pripravil|ustvaril|napisal|sestavil)\s+(?:[\p{L}]+\s+)*?strokovnjak\s+za\s+potoval[^,]*?,/giu,
  ],
  hu: [
    /,\s+utazási\s+tartalom\s+szakértő(?:ként)?[^,]*?,/gi,
    // "ez az útikalauz, egy tapasztalt utazási tartalomszakértőtől,"
    // tartalom can be glued to szakértő (one word) OR space-separated, with optional hyphen
    /,\s+egy\s+(?:[\p{L}]+\s+){0,3}?utazási\s+tartalom[\s-]*szakértő[\p{L}]*[^,]*?,/giu,
    /,\s+egy\s+(?:[\p{L}]+\s+){0,3}?utazási\s+szakértő[\p{L}]*[^,]*?,/giu,
    // "amelyet egy tapasztalt utazási tartalomszakértő állított össze,"
    /,\s+amelyet\s+egy\s+(?:[\p{L}]+\s+){0,3}?utazási\s+tartalom[\s-]*szakértő[\p{L}]*[^,]*?,/giu,
    /,\s+melyet\s+egy\s+(?:[\p{L}]+\s+){0,3}?utazási\s+tartalom[\s-]*szakértő[\p{L}]*[^,]*?,/giu,
  ],
  ru: [
    /,\s+как\s+(?:опытный\s+)?эксперт\s+по\s+(?:тревел|туристическ|путеше)[^,]*?,/gi,
    // Participial: "руководство, составленное опытным экспертом по путешествиям,"
    /,\s+(?:составленное|подготовленное|написанное|созданное)\s+опытным\s+экспертом\s+по\s+путешеств[^,]*?,/gi,
  ],
};

function getReplacementSentence(article: Article): string {
  const lang = article.language || 'en';
  const dest = article.destinationName || article.destination || '';
  const template = SENTENCE_TEMPLATES[lang] || SENTENCE_TEMPLATES.en;
  return template
    .replace(/\{dest\}/g, dest)
    .replace(/\{theme\}/g, themePhrase(article.theme));
}

/**
 * Split content into "blocks" delimited by paragraph breaks, then within each block
 * iterate sentences. Sentence boundary: . ! ? followed by whitespace or end.
 * We avoid breaking on bullet points (markdown lines starting with * or -) and headers.
 */
function rewriteContent(content: string, article: Article): { newContent: string; replacements: number; hadEnLeftover: boolean } {
  const lang = article.language || 'en';
  // Apply markers from ALL languages — many files have cross-language content
  // (e.g. sk/ folder containing Slovenian text due to translation bugs).
  const markers: RegExp[] = [];
  for (const ml of Object.values(AUTHOR_MARKERS)) markers.push(...ml);

  const replacement = getReplacementSentence(article);

  let replacements = 0;
  let hadEnLeftover = false;
  let replacedFirst = false;

  // Pass 1: strip mid-sentence appositives like ", from a travel content expert who's explored X,"
  // Apply ALL languages' appositive patterns (cross-language content is common in some folders).
  const appositives: RegExp[] = [];
  for (const al of Object.values(APPOSITIVE_PATTERNS)) appositives.push(...al);
  for (const ap of appositives) {
    content = content.replace(ap, () => {
      replacements++;
      return ' '; // the appositive sat between two commas — drop it cleanly
    });
  }

  // Process paragraph by paragraph so we don't cross block boundaries
  const paragraphs = content.split(/\n\n+/);
  const newParagraphs = paragraphs.map(par => {
    // Skip headers and bullet/numbered lists for sentence splitting
    if (par.startsWith('#') || /^\s*[*\-\d]/.test(par)) return par;

    // Sentence-aware split (keep punctuation with sentence)
    // Use a regex that captures the sentence + its terminator and the trailing whitespace
    const sentences = par.match(/[^.!?]+(?:[.!?]+["')\]]*\s*|$)/g);
    if (!sentences) return par;

    const newSentences = sentences.map(s => {
      const trimmed = s.trim();
      if (!trimmed) return s;
      for (const m of markers) {
        if (m.test(trimmed)) {
          replacements++;
          if (m.source.startsWith('\\bAs ') || m.source.startsWith('\\b[Hh]aving') || m.source.startsWith('\\bI[')) {
            // it's an EN pattern — if we're in non-EN, flag for review
            if (lang !== 'en') hadEnLeftover = true;
          }
          // Replace sentence with research-based equivalent.
          // Only emit the full replacement sentence the FIRST time in this article
          // (avoid duplicating the same sentence multiple times). For subsequent
          // hits, return empty so the sentence is simply removed.
          if (!replacedFirst) {
            replacedFirst = true;
            // Preserve trailing whitespace from original
            const trailing = s.match(/\s*$/)?.[0] || ' ';
            return replacement + trailing;
          } else {
            return '';
          }
        }
      }
      return s;
    });

    return newSentences.join('').replace(/\s{2,}/g, ' ').trim();
  });

  let newContent = newParagraphs.join('\n\n');

  // Cleanup: collapse 3+ consecutive newlines into double newlines, and remove empty paragraphs
  newContent = newContent.replace(/\n{3,}/g, '\n\n').replace(/\n\n\s*\n\n/g, '\n\n');
  // After appositive removal, clean up extra whitespace and stray punctuation.
  // We replaced the appositive ", X who Y," with a single space, so we may have ", " or "  " artifacts.
  newContent = newContent.replace(/[ \t]{2,}/g, ' ');
  newContent = newContent.replace(/,\s*,/g, ',');
  // Remove dangling "X, breaks down" → "X breaks down" when comma is followed by verb-starting word with no real clause separation
  // (Conservative: only fix the specific double-comma artifact above; leave natural commas alone.)

  return { newContent, replacements, hadEnLeftover };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const langArg = args.find(a => a.startsWith('--lang='))?.split('=')[1];
  const limitArg = args.find(a => a.startsWith('--limit='))?.split('=')[1];
  const limit = limitArg ? parseInt(limitArg, 10) : Infinity;

  const articlesRoot = path.join(process.cwd(), 'src', 'content', 'articles');
  const langs = langArg ? [langArg] : fs.readdirSync(articlesRoot).filter(l =>
    fs.statSync(path.join(articlesRoot, l)).isDirectory()
  );

  let totalFiles = 0;
  let totalReplacements = 0;
  let filesChanged = 0;
  let leftoverEnCount = 0;
  const samples: Array<{ file: string; before: string; after: string }> = [];

  for (const lang of langs) {
    const dir = path.join(articlesRoot, lang);
    if (!fs.existsSync(dir)) continue;
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
        if (!article.content) continue;
        const articleWithLang = { ...article, language: article.language || lang };
        const { newContent, replacements, hadEnLeftover } = rewriteContent(article.content, articleWithLang);
        if (replacements > 0) {
          if (samples.length < 5 && lang === 'en') {
            // Find the first matched sentence position in original
            const orig = article.content;
            const firstMatch = AUTHOR_MARKERS.en.map(m => orig.search(m)).filter(i => i >= 0).sort((a,b)=>a-b)[0];
            if (firstMatch !== undefined) {
              const start = Math.max(0, firstMatch - 30);
              samples.push({
                file: `${lang}/${file}`,
                before: orig.substring(start, firstMatch + 250),
                after: newContent.substring(start, start + 280),
              });
            }
          }
          langReplacements += replacements;
          totalReplacements += replacements;
          langFilesChanged++;
          filesChanged++;
          if (hadEnLeftover) leftoverEnCount++;
          if (!dryRun) {
            article.content = newContent;
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
  console.log(`Non-EN files with leftover EN intros: ${leftoverEnCount}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN (no writes)' : 'WRITTEN'}`);

  if (samples.length > 0) {
    console.log('\n=== SAMPLES (before → after) ===');
    for (const s of samples) {
      console.log(`\nFile: ${s.file}`);
      console.log('BEFORE:', s.before.replace(/\n/g, ' '));
      console.log('AFTER: ', s.after.replace(/\n/g, ' '));
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
