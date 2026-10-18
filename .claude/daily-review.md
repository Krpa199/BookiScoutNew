# Daily review, step 2: the translations

The English source of these articles was already reviewed (step 1,
`.claude/review-english.md`) and then translated by Gemini. You now review
the translations and fix what is wrong. The slugs are listed in `review-slugs.txt`.
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

## 4. Cover images

Covers were checked in step 1 on the English article. Every translation must
carry the same image fields as English (imageUrl, imageAlt, imageCredit,
imageCreditUrl, imageSource); the check script flags a mismatch. If one
differs, copy the English values.

## 5. Finish

- Make sure every file you touched is still valid JSON.
- Do not run git commit or git push; the workflow does that after you.
- End with a short summary in Croatian: how many articles were reviewed, what
  you fixed (by type, with counts), and anything you could not fix.
