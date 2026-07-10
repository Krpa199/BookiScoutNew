/**
 * One-off: inject the guide disclaimer block into guides.detail for every locale.
 * en.json already has it (added by hand). This fills the other 12.
 */
import fs from 'fs';
import path from 'path';

const MSG_DIR = path.join(process.cwd(), 'messages');

const DISCLAIMER: Record<string, { title: string; body: string; lastUpdated: string }> = {
  de: {
    title: 'Über diesen Leitfaden',
    body: 'Dieser Leitfaden basiert auf öffentlichen Informationen, Reisebewertungen und Recherchen zum Reiseziel, um Ihre Planung zu erleichtern. Wir halten ihn aktuell, doch Preise, Öffnungszeiten und Bedingungen ändern sich oft — bitte überprüfen Sie wichtige Angaben (Fahrpreise, Tickets, Einreisebestimmungen) vor Ihrer Reise bei offiziellen Quellen.',
    lastUpdated: 'Zuletzt aktualisiert am {date}',
  },
  hr: {
    title: 'O ovom vodiču',
    body: 'Ovaj je vodič sastavljen na temelju javnih informacija, recenzija putnika i istraživanja odredišta kako bismo vam pomogli u planiranju. Redovito ga ažuriramo, ali cijene, radno vrijeme i uvjeti često se mijenjaju — molimo provjerite ključne pojedinosti (cijene karata, ulaznice, uvjete ulaska) kod službenih izvora prije putovanja.',
    lastUpdated: 'Zadnje ažurirano {date}',
  },
  it: {
    title: 'Informazioni su questa guida',
    body: 'Questa guida è realizzata a partire da informazioni pubbliche, recensioni dei viaggiatori e ricerche sulla destinazione per aiutarti a pianificare. La teniamo aggiornata, ma prezzi, orari e condizioni cambiano spesso — verifica i dettagli importanti (tariffe, biglietti, requisiti di ingresso) presso fonti ufficiali prima di partire.',
    lastUpdated: 'Ultimo aggiornamento {date}',
  },
  fr: {
    title: 'À propos de ce guide',
    body: "Ce guide est constitué à partir d'informations publiques, d'avis de voyageurs et de recherches sur la destination pour vous aider à préparer votre voyage. Nous le tenons à jour, mais les prix, horaires et conditions changent souvent — vérifiez les détails importants (tarifs, billets, formalités d'entrée) auprès de sources officielles avant de partir.",
    lastUpdated: 'Dernière mise à jour le {date}',
  },
  es: {
    title: 'Acerca de esta guía',
    body: 'Esta guía se ha elaborado a partir de información pública, opiniones de viajeros e investigación sobre el destino para ayudarte a planificar. La mantenemos actualizada, pero los precios, horarios y condiciones cambian con frecuencia — comprueba los datos importantes (tarifas, entradas, requisitos de entrada) en fuentes oficiales antes de viajar.',
    lastUpdated: 'Última actualización: {date}',
  },
  pl: {
    title: 'O tym przewodniku',
    body: 'Ten przewodnik powstał na podstawie ogólnodostępnych informacji, opinii podróżnych i analizy kierunku, aby pomóc Ci w planowaniu. Aktualizujemy go na bieżąco, ale ceny, godziny otwarcia i warunki często się zmieniają — przed podróżą sprawdź najważniejsze szczegóły (ceny biletów, wstęp, wymogi wjazdowe) w źródłach oficjalnych.',
    lastUpdated: 'Ostatnia aktualizacja: {date}',
  },
  nl: {
    title: 'Over deze gids',
    body: 'Deze gids is samengesteld op basis van openbare informatie, reizigersbeoordelingen en bestemmingsonderzoek om je te helpen plannen. We houden hem actueel, maar prijzen, openingstijden en voorwaarden veranderen vaak — controleer belangrijke gegevens (tarieven, tickets, toegangsregels) bij officiële bronnen voordat je op reis gaat.',
    lastUpdated: 'Laatst bijgewerkt op {date}',
  },
  cz: {
    title: 'O tomto průvodci',
    body: 'Tento průvodce vychází z veřejných informací, recenzí cestovatelů a průzkumu destinace, aby vám pomohl s plánováním. Průběžně jej aktualizujeme, ale ceny, otevírací doba a podmínky se často mění — před cestou si prosím ověřte důležité údaje (jízdné, vstupenky, vstupní požadavky) z oficiálních zdrojů.',
    lastUpdated: 'Naposledy aktualizováno {date}',
  },
  sk: {
    title: 'O tomto sprievodcovi',
    body: 'Tohto sprievodcu sme zostavili z verejných informácií, recenzií cestovateľov a prieskumu destinácie, aby sme vám pomohli s plánovaním. Priebežne ho aktualizujeme, ale ceny, otváracie hodiny a podmienky sa často menia — pred cestou si prosím overte dôležité údaje (cestovné, vstupenky, vstupné požiadavky) z oficiálnych zdrojov.',
    lastUpdated: 'Naposledy aktualizované {date}',
  },
  sl: {
    title: 'O tem vodniku',
    body: 'Ta vodnik je pripravljen na podlagi javnih informacij, mnenj popotnikov in raziskave destinacije, da vam pomaga pri načrtovanju. Redno ga posodabljamo, vendar se cene, delovni čas in pogoji pogosto spreminjajo — pred potovanjem preverite ključne podatke (vozovnice, vstopnice, pogoje za vstop) pri uradnih virih.',
    lastUpdated: 'Nazadnje posodobljeno {date}',
  },
  hu: {
    title: 'Erről az útmutatóról',
    body: 'Ez az útmutató nyilvános információk, utazói vélemények és úti célra vonatkozó kutatás alapján készült, hogy segítsen a tervezésben. Folyamatosan frissítjük, de az árak, a nyitvatartás és a feltételek gyakran változnak — utazás előtt kérjük, ellenőrizze a fontos részleteket (viteldíjak, jegyek, beutazási feltételek) hivatalos forrásokból.',
    lastUpdated: 'Utoljára frissítve: {date}',
  },
  ru: {
    title: 'Об этом путеводителе',
    body: 'Этот путеводитель составлен на основе общедоступной информации, отзывов путешественников и исследования направления, чтобы помочь вам в планировании. Мы поддерживаем его в актуальном состоянии, но цены, часы работы и условия часто меняются — перед поездкой уточняйте важные детали (стоимость проезда, билеты, правила въезда) в официальных источниках.',
    lastUpdated: 'Последнее обновление: {date}',
  },
};

let updated = 0;
for (const [lang, disc] of Object.entries(DISCLAIMER)) {
  const file = path.join(MSG_DIR, `${lang}.json`);
  const msg = JSON.parse(fs.readFileSync(file, 'utf-8'));
  if (!msg.guides?.detail) {
    console.log(`  ⚠️ ${lang}: no guides.detail, skipping`);
    continue;
  }
  // Insert disclaimer right before faq, mirroring en.json order
  const detail = msg.guides.detail;
  const rebuilt: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(detail)) {
    if (k === 'faq') rebuilt.disclaimer = disc;
    rebuilt[k] = v;
  }
  if (!rebuilt.disclaimer) rebuilt.disclaimer = disc; // fallback if no faq key
  msg.guides.detail = rebuilt;
  fs.writeFileSync(file, JSON.stringify(msg, null, 2) + '\n', 'utf-8');
  console.log(`  ✅ ${lang}: disclaimer added`);
  updated++;
}
console.log(`\nDone — ${updated} locales updated.`);
