# Daily review of OLD published articles

These articles have been live for months; they are listed in `old-slugs.txt`
(`src/content/articles/<lang>/<slug>.json`, 13 languages: en, de, pl, cz, it,
hu, sk, nl, sl, fr, es, ru, hr). Bulk problems (cut-off text, raw JSON,
foreign currencies, wrong-place covers, AI talk, kuna, ETIAS dates) were
already fixed on 2026-10-18/19. Your job is what tools cannot find: errors a
careful local reader would notice. Readers are people PLANNING a holiday in
Croatia; some rank in Google, so change only what is wrong.

## 1. Read each English article completely

title, metaDescription, quickAnswer, content, faq, tableData. Look for:
- **Wrong facts about places:** a business, beach or sight put in the wrong
  town or island (e.g. a Krk-town restaurant described as being in Kornić),
  wrong island for a town, impossible distances or travel times, ferry
  routes that don't exist, things that closed or are banned (swimming at Krka
  and Plitvice is not allowed).
- **Invented places:** a business or venue you believe does not exist, or
  that the text calls hypothetical/fictional. Remove the name, keep the advice.
- **Contradictions** inside the article (quickAnswer vs body vs table vs FAQ).
- **Money and dates:** prices in euros only; the season readers plan is 2027.
- **Leftovers** of generation: sentences addressed to an AI or about the
  article itself, headings that are instructions ("Opinionated Statement"),
  the same sentence twice.
If you are not sure about a fact, make the sentence less specific rather than
inventing a new number. Do not add new facts. Do not rewrite style, do not
shorten articles, and leave the intro sentence about "insights from hundreds
of traveler reviews" as it is (the owner decided to keep it).

Look at the cover too (`curl -sL -A "Mozilla/5.0" "<imageUrl>" -o /tmp/<slug>.jpg`,
then Read it). If it clearly shows another place or something unrelated, or
if another article of the same destination already uses the same imageUrl
(search src/content/articles/en/ for that imageUrl with the Grep tool), find
a different correct one: `npx tsx scripts/find-commons-image.ts "<Place>"`, look at
2–3 candidates, apply with `--apply <slug> <n> "<same search>" --alt "<text>"`
(that updates all 13 languages).

## 2. Carry every English fix into the 12 translations

For each sentence you corrected in English, find the same sentence in each
translation and correct it the same way, in that language (same facts, same
names, euros). Edit only those sentences. Never replace a whole translation.
Keep every file valid JSON.

## 3. Finish

Do not commit or push. End with a short summary in Croatian: articles
reviewed, what you fixed (with counts by type), and anything you were unsure
about.
