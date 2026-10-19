# Daily review, step 1: the English source

The daily generator just wrote new English articles; they are listed in
`review-slugs.txt` (`src/content/articles/en/<slug>.json`). They are not
translated yet: after you, Gemini translates your corrected English into 12
languages, so every error you leave here is copied 12 times. Readers are
people PLANNING a holiday in Croatia.

## 1. Read each article completely

title, metaDescription, quickAnswer, content, faq, tableData. Fix with minimal
edits to the JSON (Edit tool). Do not rewrite articles that are fine.

Check for:
- **Money:** all prices in euros (€). Never $, £ or kuna/HRK.
- **Year:** the planning season is 2027; titles and "current prices" refer to
  2027 (Advent articles keep their own year).
- **Place names:** usual English forms in English text ("Plitvice Lakes", not
  "Plitvička Jezera"); the right island/region (Supetar and Bol are on Brač,
  Jelsa and Stari Grad on Hvar, Baška on Krk, Mali Lošinj on Lošinj).
- **Facts that are clearly wrong** for Croatia: wrong island, impossible
  distances or travel times, a ferry route that doesn't exist, numbers that
  contradict each other within the article (quickAnswer vs body vs table).
  If you are not sure about a fact, make the sentence less specific rather
  than inventing a new number. Do not add new facts.
- **Invented places:** remove any business, venue, accommodation or person
  the text admits is "hypothetical", "fictional", "a concept" or "an example",
  and any named place you believe does not exist (readers have tried to visit
  such places). Keep the advice, drop the name.
- **Voice:** no claims of personal experience ("I visited…"), no hype words
  (breathtaking, nestled, hidden gem, tapestry), no filler intro.
- **Title** must match what the article is about and fit ~60 characters.
- The `slug`, `destination`, `theme` and image fields must stay unchanged
  unless you are fixing the cover (below).

## Checking facts on the web

You have WebSearch and WebFetch. Check the few facts a traveller acts on and
that change yearly — parking prices and zones, ferry routes and fares
(jadrolinija.hr, krilo.hr), national park and sight tickets
(np-plitvicka-jezera.hr, np-krka.hr, citywallsdubrovnik.hr), bus/airport
lines, and whether named businesses exist where the text puts them. Prefer
official sources. Correct figures that the official source contradicts; if
2027 prices are not published, say "from €X in 2026" or "around"; if nothing
reliable is found, make the sentence less specific. Never invent numbers, do
not copy text from websites, and do not add links to the article.

## 2. Cover image — every article must end up with a correct one

The cover must show the article's own place (for "X vs Y": X; for "stay
nearby": the main town). It is copied to all translations, so fix it here.

1. If there is no `imageUrl`, run `npx tsx scripts/add-missing-covers.ts <slug>`.
2. The cover should not be one another article already uses
   (search src/content/articles/en/ for that imageUrl with the Grep tool); if it is,
   look for a different one (step 3). Order of priority: (a) the right place,
   (b) not used elsewhere. Small places (Fažana, Biograd, Rabac) have few
   photos: then a neutral on-topic photo with no identifiable other place
   (a local dish, a pebble beach, a parking sign) is fine, and reusing a
   correct photo is better than a wrong place or a poor photo.
   Look at the cover yourself: `curl -sL -A "Mozilla/5.0" "<imageUrl>" -o /tmp/<slug>.jpg`,
   open it with the Read tool, and read `imageAlt`. Reject it if it shows
   another identifiable place (another town, island or landmark; boat
   registration letters such as "CS" = Cres, "UM" = Umag give it away), an
   off-topic subject (a car, cables), or is low quality.
3. If rejected or still missing, search Wikimedia Commons:
   `npx tsx scripts/find-commons-image.ts "<Place name>"` (try the local name,
   e.g. "Mali Lošinj"). Download 2–3 candidates, look at them, apply the best:
   `npx tsx scripts/find-commons-image.ts --apply <slug> <n> "<same search>" --alt "<short English description>"`.

Never leave an article without a cover or with a cover of the wrong place.

## 3. Finish

Keep every file valid JSON. Do not commit or push. End with a short summary
in Croatian: articles reviewed, what you fixed (by type, with counts), and
anything you could not fix.
