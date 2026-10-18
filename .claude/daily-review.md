# Daily article review

You review the articles that the daily generator (`generate-articles.yml`) just
published, and fix what is wrong. The slugs are listed in `review-slugs.txt`.
Every article exists in 13 languages: `src/content/articles/<lang>/<slug>.json`
(en, de, pl, cz, it, hu, sk, nl, sl, fr, es, ru, hr). English is the source.

The site's readers are people PLANNING a holiday in Croatia. Titles and meta
descriptions are what they see in Google, so they must read like a native
speaker wrote them.

## 1. Run the mechanical check first

    npx tsx scripts/check-daily-articles.ts --file review-slugs.txt

Fix everything it flags.

## 2. Read every title and metaDescription yourself

Do this for all 12 translations of every article (in that order of care:
hr, de, pl, cz, hu, sk, then the rest). Fix only real errors, by editing the
JSON. Known Flash-Lite mistakes to look for:

- Untranslated or half-English titles; garbled words ("Isisplati", "Kliduplné",
  "Hol Se Mitérni", Greek letters inside a Slovak word).
- "vs" left as "vs." / translated as "protiv", "naspram": use the natural word
  for "or" (hr "ili", de "oder", pl "czy", cz "nebo", hu "vagy", sk "alebo",
  sl "ali", it "o", fr "ou", es "o", nl "of", ru "или").
- Wrong grammatical case of place names (hr "posjetiti Korčulu", not
  "Korčula"; "Usporedite Omiš i Makarsku"; plural "Vodice su").
- Wrong words that look alike (hr "plaće" = salaries vs "plaže" = beaches).
- Wrong language altogether (Slovak pages written in Slovenian).
- Prices must be in euros (€), never $ or kuna. Years: the season is 2027
  (Advent articles keep their own year).
- "Plitvička Jezera" in a foreign-language title should be that language's
  usual name (Plitvice Lakes, Plitvicer Seen, Jeziora Plitwickie…).

Also skim `quickAnswer` and the FAQ questions; they show up in search results.

## 3. Bodies

Do not rewrite article bodies. Only if the check says a body is in the wrong
language (e.g. Slovak page in Slovenian) or English, translate that article
yourself from the English source: title, metaDescription, quickAnswer,
content, faq, tableData. Keep every other field (images, dates, destination)
unchanged.

## 4. Cover images — every article must end up with a correct one

The cover must show the article's own place (for "X vs Y" articles: X; for
"stay nearby": the main town). Check every article's cover, not only missing
ones:

1. If an English article has no `imageUrl`, first run
   `npx tsx scripts/add-missing-covers.ts <slug>`.
2. Look at the cover yourself: download it with
   `curl -sL -A "Mozilla/5.0" "<imageUrl>" -o /tmp/<slug>.jpg` and open it with
   the Read tool. Also read `imageAlt`. Reject it if it shows another
   identifiable place (another town, island or landmark; boat registration
   letters like "CS" = Cres, "UM" = Umag give it away), an off-topic subject
   (a car, cables), or is low quality.
3. If rejected or still missing, search Wikimedia Commons, which has photos of
   nearly every Croatian town:
   `npx tsx scripts/find-commons-image.ts "<Place name>"` (try the local name,
   e.g. "Mali Lošinj", "Baška Voda"). Download 2–3 promising candidates, look at
   them, and apply the best with
   `npx tsx scripts/find-commons-image.ts --apply <slug> <n> "<same search>" --alt "<short English description of what the photo shows>"`.
   This sets the cover and attribution in all 13 languages.

Never leave an article without a cover, and never keep a cover of the wrong place.

## 5. Finish

- Make sure every file you touched is still valid JSON.
- Do not run git commit or git push; the workflow does that after you.
- End with a short summary in Croatian: how many articles were reviewed, what
  you fixed (by type, with counts), and anything you could not fix.
