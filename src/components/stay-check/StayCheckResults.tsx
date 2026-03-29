'use client';

import { useEffect, useState } from 'react';
import {
  CheckCircle, XCircle, AlertTriangle, MapPin, MessageCircle,
  Star, Footprints, Volume2, Shield, Wallet, ExternalLink,
  Users, Baby, Heart, User, Laptop, Waves, UtensilsCrossed,
  Landmark, ShoppingBag, Sparkles, Coffee, TreePine,
  Accessibility, ChevronDown, Award, Eye, Wine, Music
} from 'lucide-react';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Props { data: any; locale?: string; }

// ── Animated Score Ring ──────────────────────────────────────────────
function ScoreRing({ score, size = 100, strokeWidth = 8, delay = 0, label = 'score' }: { score: number; size?: number; strokeWidth?: number; delay?: number; label?: string }) {
  const [animated, setAnimated] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';

  useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0;
      const interval = setInterval(() => {
        current += 1;
        if (current >= score) { clearInterval(interval); setAnimated(score); }
        else setAnimated(current);
      }, 15);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timer);
  }, [score, delay]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (animated / 100) * circumference}
          style={{ transition: 'stroke-dashoffset 0.3s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl md:text-3xl font-black text-white">{animated}</span>
        <span className="text-[10px] text-white/60 uppercase tracking-wider font-medium">{label}</span>
      </div>
    </div>
  );
}

// ── Expandable Section ───────────────────────────────────────────────
function ExpandableSection({ title, icon: Icon, children, defaultOpen = true, accent = 'ocean' }: {
  title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean; accent?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const accents: Record<string, string> = {
    ocean: 'from-ocean-500 to-ocean-600',
    seafoam: 'from-emerald-500 to-emerald-600',
    coral: 'from-rose-500 to-rose-600',
    sand: 'from-amber-500 to-amber-600',
    purple: 'from-violet-500 to-violet-600',
  };
  return (
    <div className="px-5 md:px-7">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 py-4 md:py-5 transition-colors hover:opacity-80">
        <div className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br ${accents[accent]} rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0`}>
          <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
        <h3 className="text-lg md:text-xl font-bold text-slate-900 flex-1 text-left">{title}</h3>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${open ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="pb-5 md:pb-7">{children}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Gemini sometimes returns objects instead of strings — safely convert to string
function str(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (val.name) return `${val.name}${val.description ? ' — ' + val.description : ''}${val.bestQuote ? ' "' + val.bestQuote + '"' : ''}`;
  return JSON.stringify(val);
}

// Check if a value is actually useful (not N/A, not "Nije dostupno", etc.)
function hasValue(val: any): boolean {
  if (!val) return false;
  const s = String(val).toLowerCase().trim();
  if (s.length === 0) return false;
  // Filter out all "no data" variants across languages
  const noDataPatterns = [
    'n/a', 'na', '-', 'unknown', 'not available', 'no data', 'no data found', 'none', 'none found',
    'nema podataka', 'nije dostupno', 'nepoznato', 'nema',
    'nicht verfügbar', 'keine daten', 'unbekannt',
    'non disponibile', 'nessun dato', 'sconosciuto',
    'no disponible', 'sin datos', 'desconocido',
    'indisponible', 'pas de données', 'inconnu',
    'brak danych', 'niedostępne', 'nieznane',
    'нет данных', 'недоступно', 'неизвестно',
    'nincs adat', 'nem elérhető', 'ismeretlen',
    'žádná data', 'nedostupné', 'neznáme',
    'žiadne údaje', 'nedostupné',
    'geen gegevens', 'niet beschikbaar', 'onbekend',
    'ni podatkov', 'ni na voljo', 'neznano',
  ];
  return !noDataPatterns.includes(s) && !s.startsWith('no data') && !s.startsWith('nema pod');
}

const UI: Record<string, Record<string, string>> = {
  en: { pros: 'Pros', cons: 'Cons', risks: 'Risks', realityCheck: 'Reality Check', beaches: 'Beaches', restaurants: 'Restaurants & Dining', bars: 'Bars, Cafes & Nightlife', nightlifeScene: 'Nightlife Scene', barsLabel: 'Bars', cafesLabel: 'Cafes', attractions: 'Attractions & Activities', activities: 'Activities', prices: 'Prices & Budget', perDay: 'per day', walkability: 'Walkability & Nearby', townCenter: 'Town Center', noiseLevel: 'Noise Level', family: 'Family & Safety', accessibility: 'Accessibility', hiddenGems: 'Hidden Gems', reviews: 'Google rating from', reviewsSuffix: 'reviews', questions: 'Ask Before Booking', seasonalTip: 'Seasonal Tip', finalVerdict: 'Final Verdict', alternatives: 'Consider Alternatives', nearby: 'Everything Nearby', basedOn: 'Based on', footer: 'reviews + Google data', families: 'Families', couples: 'Couples', groups: 'Groups', solo: 'Solo Travelers', nomads: 'Digital Nomads', score: 'score', bestFor: 'Best for', avoid: 'Avoid', topPick: 'Top Pick', familyFriendly: 'Family friendly', terrace: 'Terrace', until: 'Until', searchBooking: 'Search on Booking.com' },
  hr: { pros: 'Prednosti', cons: 'Nedostaci', risks: 'Rizici', realityCheck: 'Provjera stvarnosti', beaches: 'Plaže', restaurants: 'Restorani', bars: 'Barovi, Kafići i Noćni život', nightlifeScene: 'Noćni život', barsLabel: 'Barovi', cafesLabel: 'Kafići', attractions: 'Znamenitosti i Aktivnosti', activities: 'Aktivnosti', prices: 'Cijene i Budžet', perDay: 'dnevno', walkability: 'Pješačenje i Okolina', townCenter: 'Centar grada', noiseLevel: 'Razina buke', family: 'Obitelj i Sigurnost', accessibility: 'Pristupačnost', hiddenGems: 'Skriveni dragulji', reviews: 'Google ocjena iz', reviewsSuffix: 'recenzija', questions: 'Pitajte prije rezervacije', seasonalTip: 'Sezonski savjet', finalVerdict: 'Zaključak', alternatives: 'Razmotriti alternative', nearby: 'Sve u blizini', basedOn: 'Bazirano na', footer: 'recenzija + Google podaci', families: 'Obitelji', couples: 'Parovi', groups: 'Grupe', solo: 'Solo putnici', nomads: 'Digitalni nomadi', score: 'ocjena', bestFor: 'Najbolje za', avoid: 'Izbjegavajte', topPick: 'Najbolji izbor', familyFriendly: 'Za obitelji', terrace: 'Terasa', until: 'Do', searchBooking: 'Traži na Booking.com' },
  de: { pros: 'Vorteile', cons: 'Nachteile', risks: 'Risiken', realityCheck: 'Realitätscheck', beaches: 'Strände', restaurants: 'Restaurants', bars: 'Bars, Cafés & Nachtleben', nightlifeScene: 'Nachtleben', barsLabel: 'Bars', cafesLabel: 'Cafés', attractions: 'Sehenswürdigkeiten & Aktivitäten', activities: 'Aktivitäten', prices: 'Preise & Budget', perDay: 'pro Tag', walkability: 'Erreichbarkeit & Umgebung', townCenter: 'Stadtzentrum', noiseLevel: 'Lärmpegel', family: 'Familie & Sicherheit', accessibility: 'Barrierefreiheit', hiddenGems: 'Geheimtipps', reviews: 'Google-Bewertung aus', reviewsSuffix: 'Bewertungen', questions: 'Vor der Buchung fragen', seasonalTip: 'Saisontipp', finalVerdict: 'Fazit', alternatives: 'Alternativen', nearby: 'Alles in der Nähe', basedOn: 'Basierend auf', footer: 'Bewertungen + Google-Daten', families: 'Familien', couples: 'Paare', groups: 'Gruppen', solo: 'Alleinreisende', nomads: 'Digitale Nomaden', score: 'Bewertung', bestFor: 'Am besten für', avoid: 'Vermeiden', topPick: 'Top-Empfehlung', familyFriendly: 'Familienfreundlich', terrace: 'Terrasse', until: 'Bis', searchBooking: 'Auf Booking.com suchen' },
  pl: { pros: 'Zalety', cons: 'Wady', risks: 'Ryzyka', realityCheck: 'Sprawdzenie', beaches: 'Plaże', restaurants: 'Restauracje', bars: 'Bary, Kawiarnie i Życie nocne', nightlifeScene: 'Życie nocne', barsLabel: 'Bary', cafesLabel: 'Kawiarnie', attractions: 'Atrakcje i Aktywności', activities: 'Aktywności', prices: 'Ceny i Budżet', perDay: 'dziennie', walkability: 'Dostępność pieszo', townCenter: 'Centrum miasta', noiseLevel: 'Poziom hałasu', family: 'Rodzina i Bezpieczeństwo', accessibility: 'Dostępność', hiddenGems: 'Ukryte perełki', reviews: 'Ocena Google z', reviewsSuffix: 'opinii', questions: 'Zapytaj przed rezerwacją', seasonalTip: 'Porada sezonowa', finalVerdict: 'Podsumowanie', alternatives: 'Alternatywy', nearby: 'Wszystko w pobliżu', basedOn: 'Na podstawie', footer: 'opinii + dane Google', families: 'Rodziny', couples: 'Pary', groups: 'Grupy', solo: 'Solo', nomads: 'Cyfrowi nomadzi', score: 'ocena', bestFor: 'Najlepsze dla', avoid: 'Unikaj', topPick: 'Najlepszy wybór', familyFriendly: 'Dla rodzin', terrace: 'Taras', until: 'Do', searchBooking: 'Szukaj na Booking.com' },
  cz: { pros: 'Výhody', cons: 'Nevýhody', risks: 'Rizika', realityCheck: 'Kontrola reality', beaches: 'Pláže', restaurants: 'Restaurace', bars: 'Bary, Kavárny a Noční život', nightlifeScene: 'Noční život', barsLabel: 'Bary', cafesLabel: 'Kavárny', attractions: 'Atrakce a Aktivity', activities: 'Aktivity', prices: 'Ceny a Rozpočet', perDay: 'denně', walkability: 'Dostupnost pěšky', townCenter: 'Centrum města', noiseLevel: 'Úroveň hluku', family: 'Rodina a Bezpečnost', accessibility: 'Přístupnost', hiddenGems: 'Skryté perly', reviews: 'Google hodnocení z', reviewsSuffix: 'recenzí', questions: 'Zeptejte se před rezervací', seasonalTip: 'Sezónní tip', finalVerdict: 'Závěr', alternatives: 'Alternativy', nearby: 'Vše v okolí', basedOn: 'Na základě', footer: 'recenzí + data Google', families: 'Rodiny', couples: 'Páry', groups: 'Skupiny', solo: 'Sólo cestovatele', nomads: 'Digitální nomádi', score: 'skóre', bestFor: 'Nejlepší pro', avoid: 'Vyhněte se', topPick: 'Nejlepší volba', familyFriendly: 'Pro rodiny', terrace: 'Terasa', until: 'Do', searchBooking: 'Hledat na Booking.com' },
  it: { pros: 'Vantaggi', cons: 'Svantaggi', risks: 'Rischi', realityCheck: 'Verifica realtà', beaches: 'Spiagge', restaurants: 'Ristoranti', bars: 'Bar, Caffè e Vita notturna', nightlifeScene: 'Vita notturna', barsLabel: 'Bar', cafesLabel: 'Caffè', attractions: 'Attrazioni e Attività', activities: 'Attività', prices: 'Prezzi e Budget', perDay: 'al giorno', walkability: 'Raggiungibilità e Dintorni', townCenter: 'Centro città', noiseLevel: 'Livello di rumore', family: 'Famiglia e Sicurezza', accessibility: 'Accessibilità', hiddenGems: 'Gemme nascoste', reviews: 'Valutazione Google da', reviewsSuffix: 'recensioni', questions: 'Chiedi prima di prenotare', seasonalTip: 'Consiglio stagionale', finalVerdict: 'Verdetto finale', alternatives: 'Alternative', nearby: 'Tutto nelle vicinanze', basedOn: 'Basato su', footer: 'recensioni + dati Google', families: 'Famiglie', couples: 'Coppie', groups: 'Gruppi', solo: 'Viaggiatori singoli', nomads: 'Nomadi digitali', score: 'punteggio', bestFor: 'Ideale per', avoid: 'Evitare', topPick: 'Scelta top', familyFriendly: 'Per famiglie', terrace: 'Terrazza', until: 'Fino a', searchBooking: 'Cerca su Booking.com' },
  hu: { pros: 'Előnyök', cons: 'Hátrányok', risks: 'Kockázatok', realityCheck: 'Valóságellenőrzés', beaches: 'Strandok', restaurants: 'Éttermek', bars: 'Bárok, Kávézók és Éjszakai élet', nightlifeScene: 'Éjszakai élet', barsLabel: 'Bárok', cafesLabel: 'Kávézók', attractions: 'Látnivalók és Tevékenységek', activities: 'Tevékenységek', prices: 'Árak és Költségvetés', perDay: 'naponta', walkability: 'Megközelíthetőség', townCenter: 'Városközpont', noiseLevel: 'Zajszint', family: 'Család és Biztonság', accessibility: 'Akadálymentesség', hiddenGems: 'Rejtett kincsek', reviews: 'Google értékelés', reviewsSuffix: 'vélemény alapján', questions: 'Kérdezzen foglalás előtt', seasonalTip: 'Szezonális tipp', finalVerdict: 'Végső ítélet', alternatives: 'Alternatívák', nearby: 'Minden a közelben', basedOn: 'Alapja', footer: 'vélemény + Google adatok', families: 'Családok', couples: 'Párok', groups: 'Csoportok', solo: 'Egyedül utazók', nomads: 'Digitális nomádok', score: 'pontszám', bestFor: 'Legjobb', avoid: 'Kerülje', topPick: 'Legjobb választás', familyFriendly: 'Családbarát', terrace: 'Terasz', until: 'Ig', searchBooking: 'Keresés a Booking.com-on' },
  sk: { pros: 'Výhody', cons: 'Nevýhody', risks: 'Riziká', realityCheck: 'Kontrola reality', beaches: 'Pláže', restaurants: 'Reštaurácie', bars: 'Bary, Kaviarne a Nočný život', nightlifeScene: 'Nočný život', barsLabel: 'Bary', cafesLabel: 'Kaviarne', attractions: 'Atrakcie a Aktivity', activities: 'Aktivity', prices: 'Ceny a Rozpočet', perDay: 'denne', walkability: 'Dostupnosť pešo', townCenter: 'Centrum mesta', noiseLevel: 'Úroveň hluku', family: 'Rodina a Bezpečnosť', accessibility: 'Prístupnosť', hiddenGems: 'Skryté perly', reviews: 'Google hodnotenie z', reviewsSuffix: 'recenzií', questions: 'Opýtajte sa pred rezerváciou', seasonalTip: 'Sezónny tip', finalVerdict: 'Záver', alternatives: 'Alternatívy', nearby: 'Všetko v okolí', basedOn: 'Na základe', footer: 'recenzií + dáta Google', families: 'Rodiny', couples: 'Páry', groups: 'Skupiny', solo: 'Sólo cestovatelia', nomads: 'Digitálni nomádi', score: 'skóre', bestFor: 'Najlepšie pre', avoid: 'Vyhnite sa', topPick: 'Najlepšia voľba', familyFriendly: 'Pre rodiny', terrace: 'Terasa', until: 'Do', searchBooking: 'Hľadať na Booking.com' },
  nl: { pros: 'Voordelen', cons: 'Nadelen', risks: "Risico's", realityCheck: 'Realiteitscheck', beaches: 'Stranden', restaurants: 'Restaurants', bars: 'Bars, Cafés & Nachtleven', nightlifeScene: 'Nachtleven', barsLabel: 'Bars', cafesLabel: 'Cafés', attractions: 'Bezienswaardigheden & Activiteiten', activities: 'Activiteiten', prices: 'Prijzen & Budget', perDay: 'per dag', walkability: 'Bereikbaarheid & Omgeving', townCenter: 'Stadscentrum', noiseLevel: 'Geluidsniveau', family: 'Gezin & Veiligheid', accessibility: 'Toegankelijkheid', hiddenGems: 'Verborgen pareltjes', reviews: 'Google beoordeling van', reviewsSuffix: 'beoordelingen', questions: 'Vraag voor het boeken', seasonalTip: 'Seizoenstip', finalVerdict: 'Eindoordeel', alternatives: 'Alternatieven', nearby: 'Alles in de buurt', basedOn: 'Gebaseerd op', footer: 'beoordelingen + Google data', families: 'Gezinnen', couples: 'Stellen', groups: 'Groepen', solo: 'Solo reizigers', nomads: 'Digitale nomaden', score: 'score', bestFor: 'Best voor', avoid: 'Vermijd', topPick: 'Beste keuze', familyFriendly: 'Gezinsvriendelijk', terrace: 'Terras', until: 'Tot', searchBooking: 'Zoeken op Booking.com' },
  sl: { pros: 'Prednosti', cons: 'Slabosti', risks: 'Tveganja', realityCheck: 'Preverjanje', beaches: 'Plaže', restaurants: 'Restavracije', bars: 'Bari, Kavarne in Nočno življenje', nightlifeScene: 'Nočno življenje', barsLabel: 'Bari', cafesLabel: 'Kavarne', attractions: 'Znamenitosti in Aktivnosti', activities: 'Aktivnosti', prices: 'Cene in Proračun', perDay: 'na dan', walkability: 'Dostopnost peš', townCenter: 'Center mesta', noiseLevel: 'Raven hrupa', family: 'Družina in Varnost', accessibility: 'Dostopnost', hiddenGems: 'Skriti biseri', reviews: 'Google ocena iz', reviewsSuffix: 'ocen', questions: 'Vprašajte pred rezervacijo', seasonalTip: 'Sezonski nasvet', finalVerdict: 'Končna ocena', alternatives: 'Alternative', nearby: 'Vse v bližini', basedOn: 'Na podlagi', footer: 'ocen + Google podatki', families: 'Družine', couples: 'Pari', groups: 'Skupine', solo: 'Solo popotniki', nomads: 'Digitalni nomadi', score: 'ocena', bestFor: 'Najboljše za', avoid: 'Izogibajte se', topPick: 'Najboljša izbira', familyFriendly: 'Za družine', terrace: 'Terasa', until: 'Do', searchBooking: 'Išči na Booking.com' },
  fr: { pros: 'Avantages', cons: 'Inconvénients', risks: 'Risques', realityCheck: 'Vérification', beaches: 'Plages', restaurants: 'Restaurants', bars: 'Bars, Cafés et Vie nocturne', nightlifeScene: 'Vie nocturne', barsLabel: 'Bars', cafesLabel: 'Cafés', attractions: 'Attractions et Activités', activities: 'Activités', prices: 'Prix et Budget', perDay: 'par jour', walkability: 'Accessibilité et Environs', townCenter: 'Centre-ville', noiseLevel: 'Niveau de bruit', family: 'Famille et Sécurité', accessibility: 'Accessibilité', hiddenGems: 'Pépites cachées', reviews: 'Note Google de', reviewsSuffix: 'avis', questions: 'À demander avant de réserver', seasonalTip: 'Conseil saisonnier', finalVerdict: 'Verdict final', alternatives: 'Alternatives', nearby: 'Tout à proximité', basedOn: 'Basé sur', footer: 'avis + données Google', families: 'Familles', couples: 'Couples', groups: 'Groupes', solo: 'Voyageurs solo', nomads: 'Nomades numériques', score: 'score', bestFor: 'Idéal pour', avoid: 'À éviter', topPick: 'Meilleur choix', familyFriendly: 'Familial', terrace: 'Terrasse', until: "Jusqu'à", searchBooking: 'Chercher sur Booking.com' },
  es: { pros: 'Ventajas', cons: 'Desventajas', risks: 'Riesgos', realityCheck: 'Verificación', beaches: 'Playas', restaurants: 'Restaurantes', bars: 'Bares, Cafés y Vida nocturna', nightlifeScene: 'Vida nocturna', barsLabel: 'Bares', cafesLabel: 'Cafés', attractions: 'Atracciones y Actividades', activities: 'Actividades', prices: 'Precios y Presupuesto', perDay: 'por día', walkability: 'Accesibilidad y Alrededores', townCenter: 'Centro', noiseLevel: 'Nivel de ruido', family: 'Familia y Seguridad', accessibility: 'Accesibilidad', hiddenGems: 'Joyas ocultas', reviews: 'Calificación Google de', reviewsSuffix: 'reseñas', questions: 'Preguntar antes de reservar', seasonalTip: 'Consejo estacional', finalVerdict: 'Veredicto final', alternatives: 'Alternativas', nearby: 'Todo cerca', basedOn: 'Basado en', footer: 'reseñas + datos de Google', families: 'Familias', couples: 'Parejas', groups: 'Grupos', solo: 'Viajeros solos', nomads: 'Nómadas digitales', score: 'puntuación', bestFor: 'Ideal para', avoid: 'Evitar', topPick: 'Mejor elección', familyFriendly: 'Familiar', terrace: 'Terraza', until: 'Hasta', searchBooking: 'Buscar en Booking.com' },
  ru: { pros: 'Плюсы', cons: 'Минусы', risks: 'Риски', realityCheck: 'Проверка реальности', beaches: 'Пляжи', restaurants: 'Рестораны', bars: 'Бары, Кафе и Ночная жизнь', nightlifeScene: 'Ночная жизнь', barsLabel: 'Бары', cafesLabel: 'Кафе', attractions: 'Достопримечательности и Активности', activities: 'Активности', prices: 'Цены и Бюджет', perDay: 'в день', walkability: 'Пешая доступность', townCenter: 'Центр города', noiseLevel: 'Уровень шума', family: 'Семья и Безопасность', accessibility: 'Доступность', hiddenGems: 'Скрытые жемчужины', reviews: 'Рейтинг Google из', reviewsSuffix: 'отзывов', questions: 'Спросите перед бронированием', seasonalTip: 'Сезонный совет', finalVerdict: 'Итоговый вердикт', alternatives: 'Альтернативы', nearby: 'Всё рядом', basedOn: 'На основе', footer: 'отзывов + данные Google', families: 'Семьи', couples: 'Пары', groups: 'Группы', solo: 'Соло путешественники', nomads: 'Цифровые кочевники', score: 'оценка', bestFor: 'Лучше всего для', avoid: 'Избегайте', topPick: 'Лучший выбор', familyFriendly: 'Для семей', terrace: 'Терраса', until: 'До', searchBooking: 'Искать на Booking.com' },
};

export default function StayCheckResults({ data, locale = 'en' }: Props) {
  const t = UI[locale] || UI.en;
  const { accommodation, scores, reviewAnalysis } = data;
  const a = data.analysis || {};
  const areaData = data.areaData || {};
  const guestScores = scores.guestTypeScores || {};
  const GUEST_ICONS: Record<string, any> = { family: Baby, couple: Heart, group: Users, solo: User, 'digital-nomad': Laptop };
  const GUEST_LABELS: Record<string, string> = { family: t.families, couple: t.couples, group: t.groups, solo: t.solo, 'digital-nomad': t.nomads };

  // Build a lookup: normalized name → googleMapsUrl from areaData
  const placeLinks = new Map<string, string>();
  for (const places of Object.values(areaData)) {
    if (!Array.isArray(places)) continue;
    for (const p of places) {
      if (p?.name && p?.googleMapsUrl) {
        placeLinks.set(p.name.toLowerCase().trim(), p.googleMapsUrl);
      }
    }
  }

  // Find Google Maps URL for an AI-generated place name (fuzzy: also tries substring match)
  function findPlaceLink(name: string | undefined): string | null {
    if (!name) return null;
    const key = name.toLowerCase().trim();
    if (placeLinks.has(key)) return placeLinks.get(key)!;
    // Try partial match (AI might shorten names)
    for (const [k, url] of placeLinks) {
      if (k.includes(key) || key.includes(k)) return url;
    }
    return null;
  }

  // Render a place name as a link (if URL found) or plain text
  function PlaceName({ name, className = '' }: { name: string; className?: string }) {
    const url = findPlaceLink(name);
    if (url) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className={`${className} hover:underline inline-flex items-center gap-1`}>
          {name}<ExternalLink className="w-3 h-3 opacity-50 flex-shrink-0" />
        </a>
      );
    }
    return <span className={className}>{name}</span>;
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 md:space-y-8 pb-12">

      {/* ═══ HERO ═══ */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-ocean-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-seafoam-500/15 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-ocean-400/5 rounded-full" />
        </div>

        <div className="relative p-6 md:p-10">
          {/* Platform + Location tag */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium text-white/80">
              {accommodation.platform}
            </span>
            <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium text-white/80 flex items-center gap-1">
              <MapPin className="w-3 h-3" />{accommodation.location.locality}
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Text */}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2">{accommodation.name}</h2>
              <p className="text-sm text-white/50">{accommodation.location.formattedAddress}</p>
            </div>

            {/* Score ring */}
            <div className="flex-shrink-0 self-center md:self-auto">
              <ScoreRing score={scores.overallScore} size={120} strokeWidth={10} label={t.score} />
            </div>
          </div>

          {/* Summary */}
          {a.shortSummary && (
            <p className="mt-6 text-base md:text-lg text-white/80 leading-relaxed border-t border-white/10 pt-6">
              {str(a.shortSummary)}
            </p>
          )}
          {a.scoreExplanation && <p className="mt-2 text-sm text-white/50">{str(a.scoreExplanation)}</p>}
        </div>
      </div>

      {/* ═══ GUEST TYPE SCORES ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {Object.entries(guestScores).map(([type, d]: [string, any]) => {
          const Icon = GUEST_ICONS[type] || Users;
          const score = parseInt(d.score) || 0;
          const bg = score >= 70 ? 'from-emerald-50 to-emerald-100/50 border-emerald-200' : score >= 40 ? 'from-amber-50 to-amber-100/50 border-amber-200' : 'from-red-50 to-red-100/50 border-red-200';
          const textColor = score >= 70 ? 'text-emerald-700' : score >= 40 ? 'text-amber-700' : 'text-red-700';
          return (
            <div key={type} className={`bg-gradient-to-br ${bg} border rounded-2xl p-3 md:p-4 text-center transition-all hover:scale-[1.02] hover:shadow-md`}>
              <Icon className={`w-5 h-5 md:w-6 md:h-6 mx-auto mb-1.5 ${textColor}`} />
              <div className={`text-xl md:text-2xl font-black ${textColor}`}>{score}</div>
              <div className="text-[10px] md:text-xs text-slate-500 font-medium mt-0.5">{GUEST_LABELS[type] || type}</div>
            </div>
          );
        })}
      </div>

      {/* ═══ PROS / CONS / RISKS — Visual Cards ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pros */}
        <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-5 border border-emerald-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-emerald-800">{t.pros}</span>
          </div>
          <ul className="space-y-3">
            {(a.pros || []).map((p: any, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                {str(p)}
              </li>
            ))}
          </ul>
        </div>

        {/* Cons */}
        <div className="bg-gradient-to-br from-rose-50 to-white rounded-2xl p-5 border border-rose-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-rose-500 rounded-xl flex items-center justify-center">
              <XCircle className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-rose-800">{t.cons}</span>
          </div>
          <ul className="space-y-3">
            {(a.cons || []).map((c: any, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 flex-shrink-0" />
                {str(c)}
              </li>
            ))}
          </ul>
        </div>

        {/* Risks */}
        <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl p-5 border border-amber-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-amber-800">{t.risks}</span>
          </div>
          <ul className="space-y-3">
            {(a.risks || []).map((r: any, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                {str(r)}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ═══ REALITY CHECK — Full-width accent ═══ */}
      {a.realityCheck && (
        <div className="relative bg-gradient-to-r from-ocean-500 to-ocean-600 rounded-2xl p-6 md:p-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-8 -mb-8" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-5 h-5 text-white" />
              <h3 className="font-bold text-white text-lg">{t.realityCheck}</h3>
            </div>
            <p className="text-base text-white/90 leading-relaxed">{str(a.realityCheck)}</p>
          </div>
        </div>
      )}

      {/* ═══ BEACHES ═══ */}
      {a.beachReport?.beaches?.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <ExpandableSection icon={Waves} title={`Beaches (${a.beachReport.beaches.length})`} accent="ocean">
            <div className="space-y-3">
              {a.beachReport.beaches.map((b: any, i: number) => (
                <div key={i} className="bg-gradient-to-br from-sky-50/80 to-white rounded-2xl p-4 md:p-5 border border-sky-100/50">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-bold text-slate-800 text-base"><PlaceName name={b.name} className="font-bold text-slate-800" /></h4>
                    <span className="text-xs bg-sky-100 text-sky-700 px-3 py-1 rounded-full font-medium flex-shrink-0 ml-2">{b.distance}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {b.type && b.type !== 'unknown' && <span className="text-xs bg-white px-3 py-1.5 rounded-full text-slate-600 border border-slate-100 font-medium">{str(b.type)}</span>}
                    {b.waterEntry && b.waterEntry !== 'unknown' && <span className="text-xs bg-white px-3 py-1.5 rounded-full text-slate-600 border border-slate-100 font-medium">{str(b.waterEntry)}</span>}
                    {b.kidsSafe && <span className="text-xs bg-emerald-100 px-3 py-1.5 rounded-full text-emerald-700 font-medium">Kids safe</span>}
                    {b.crowding && <span className="text-xs bg-amber-50 px-3 py-1.5 rounded-full text-amber-700 font-medium">{str(b.crowding)}</span>}
                  </div>
                  {b.facilities && b.facilities !== 'unknown' && <p className="text-sm text-slate-500 mb-1">Facilities: {str(b.facilities)}</p>}
                  {b.bestQuote && b.bestQuote !== 'N/A' && !String(b.bestQuote).includes('N/A') && (
                    <p className="text-sm text-slate-500 italic mt-2 border-l-2 border-sky-200 pl-3">&ldquo;{str(b.bestQuote)}&rdquo;</p>
                  )}
                </div>
              ))}
            </div>
            {(a.beachReport.bestForKids || a.beachReport.bestForRelaxing) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {a.beachReport.bestForKids && (
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <p className="text-sm font-bold text-emerald-700 mb-1">Best for kids</p>
                    <p className="text-sm text-slate-600">{a.beachReport.bestForKids}</p>
                  </div>
                )}
                {a.beachReport.bestForRelaxing && (
                  <div className="p-4 bg-sky-50 rounded-xl border border-sky-100">
                    <p className="text-sm font-bold text-sky-700 mb-1">Best for relaxing</p>
                    <p className="text-sm text-slate-600">{a.beachReport.bestForRelaxing}</p>
                  </div>
                )}
              </div>
            )}
          </ExpandableSection>
        </div>
      )}

      {/* ═══ RESTAURANTS ═══ */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <ExpandableSection icon={UtensilsCrossed} title={t.restaurants} accent="coral">
          {/* Best restaurant highlight */}
          {a.bestRestaurant && (
            <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-5 mb-4 border border-emerald-100 mx-1">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-emerald-800">{t.topPick}: <PlaceName name={a.bestRestaurant.name} className="font-bold text-emerald-800" /></span>
              </div>
              {a.bestRestaurant.distance && <p className="text-sm text-slate-500 mb-1">{a.bestRestaurant.distance} · {a.bestRestaurant.priceRange || ''}</p>}
              {a.bestRestaurant.whyBest && <p className="text-sm text-slate-600 italic border-l-2 border-emerald-200 pl-3 mt-2">&ldquo;{a.bestRestaurant.whyBest}&rdquo;</p>}
            </div>
          )}

          {/* Restaurant list */}
          {a.allRestaurants?.length > 0 && (
            <div className="mx-1 divide-y divide-slate-50">
              {a.allRestaurants.map((r: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-3 hover:bg-slate-50/50 rounded-lg transition-colors">
                  <div className="min-w-0 flex-1">
                    <PlaceName name={r.name} className="text-sm font-semibold text-slate-800" />
                    {r.knownFor && <p className="text-xs text-slate-500 mt-0.5">{str(r.knownFor)}</p>}
                  </div>
                  <div className="text-right flex-shrink-0 ml-3 flex items-center gap-2">
                    {r.rating && <span className="text-sm font-bold text-amber-600 flex items-center gap-0.5"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />{r.rating}</span>}
                    {r.priceRange && <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{str(r.priceRange)}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Avoid */}
          {a.worstRestaurant?.name && (
            <div className="mt-4 mx-1 bg-rose-50 rounded-xl p-4 border border-rose-100">
              <p className="text-sm text-rose-700"><strong>{t.avoid}:</strong> <PlaceName name={a.worstRestaurant.name} className="text-sm text-rose-700 font-semibold" /> — {a.worstRestaurant.whyWorst}</p>
            </div>
          )}

        </ExpandableSection>
      </div>

      {/* ═══ BARS, CAFES & NIGHTLIFE ═══ */}
      {(a.allBars?.length > 0 || a.allCafes?.length > 0 || a.nightlife) && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <ExpandableSection icon={Wine} title={t.bars} accent="purple">
            {/* Nightlife overview */}
            {a.nightlife && (
              <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl p-4 mb-4 border border-violet-100">
                <div className="flex items-center gap-2 mb-2">
                  <Music className="w-4 h-4 text-violet-600" />
                  <span className="font-bold text-violet-800 text-sm">{t.nightlifeScene}</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{str(a.nightlife)}</p>
              </div>
            )}

            {/* Bars */}
            {a.allBars?.length > 0 && (
              <>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Bars</p>
                <div className="space-y-3 mb-5">
                  {a.allBars.map((bar: any, i: number) => (
                    <div key={i} className="bg-gradient-to-br from-violet-50/50 to-white rounded-2xl p-4 border border-violet-100/50">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Wine className="w-4 h-4 text-violet-600" />
                          </div>
                          <div>
                            <PlaceName name={bar.name} className="text-sm font-bold text-slate-800" />
                            {bar.type && <span className="text-xs text-violet-500 ml-2">{str(bar.type)}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {hasValue(bar.rating) && <span className="text-sm font-bold text-amber-600 flex items-center gap-0.5"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />{bar.rating}</span>}
                          {bar.distance && <span className="text-xs text-slate-400">{bar.distance}</span>}
                        </div>
                      </div>
                      {hasValue(bar.atmosphere) && <p className="text-sm text-slate-600 mt-1">{str(bar.atmosphere)}</p>}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {hasValue(bar.prices) && <span className="text-xs bg-violet-100 text-violet-700 px-2.5 py-1 rounded-full font-medium">{str(bar.prices)}</span>}
                        {hasValue(bar.openUntil) && <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">{t.until} {str(bar.openUntil)}</span>}
                        {hasValue(bar.bestFor) && <span className="text-xs bg-purple-50 text-purple-600 px-2.5 py-1 rounded-full font-medium">{str(bar.bestFor)}</span>}
                      </div>
                      {hasValue(bar.bestQuote) && (
                        <p className="text-sm text-slate-500 italic mt-2 border-l-2 border-violet-200 pl-3">&ldquo;{str(bar.bestQuote)}&rdquo;</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Cafes */}
            {a.allCafes?.length > 0 && (
              <>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Cafes</p>
                <div className="space-y-3">
                  {a.allCafes.map((cafe: any, i: number) => (
                    <div key={i} className="bg-gradient-to-br from-amber-50/30 to-white rounded-2xl p-4 border border-amber-100/50">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Coffee className="w-4 h-4 text-amber-700" />
                          </div>
                          <PlaceName name={cafe.name} className="text-sm font-bold text-slate-800" />
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {hasValue(cafe.rating) && <span className="text-sm font-bold text-amber-600 flex items-center gap-0.5"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />{cafe.rating}</span>}
                          {cafe.distance && <span className="text-xs text-slate-400">{cafe.distance}</span>}
                        </div>
                      </div>
                      {hasValue(cafe.knownFor) && <p className="text-sm text-slate-600 mt-1">{str(cafe.knownFor)}</p>}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {hasValue(cafe.prices) && <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium">{str(cafe.prices)}</span>}
                        {cafe.terrace && <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-medium">{t.terrace}</span>}
                      </div>
                      {hasValue(cafe.bestQuote) && (
                        <p className="text-sm text-slate-500 italic mt-2 border-l-2 border-amber-200 pl-3">&ldquo;{str(cafe.bestQuote)}&rdquo;</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </ExpandableSection>
        </div>
      )}

      {/* ═══ ATTRACTIONS ═══ */}
      {(a.attractions?.length > 0 || a.activities?.length > 0 || areaData?.attractions?.length > 0) && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <ExpandableSection icon={Landmark} title={t.attractions} accent="sand">
            {a.attractions?.map((att: any, i: number) => (
              <div key={i} className="bg-gradient-to-br from-amber-50/50 to-white rounded-2xl p-4 border border-amber-100/50 mb-3 last:mb-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Landmark className="w-4 h-4 text-amber-600" />
                    </div>
                    <PlaceName name={att.name} className="text-sm font-bold text-slate-800" />
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0">{att.distance}</span>
                </div>
                {att.description && <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{str(att.description)}</p>}
                <div className="flex flex-wrap gap-2 mt-2">
                  {att.entryPrice && <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium">{str(att.entryPrice)}</span>}
                  {att.familyFriendly && <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-medium">{t.familyFriendly}</span>}
                </div>
                {att.bestQuote && att.bestQuote !== 'N/A' && (
                  <p className="text-sm text-slate-500 italic mt-2 border-l-2 border-amber-200 pl-3">&ldquo;{str(att.bestQuote)}&rdquo;</p>
                )}
              </div>
            ))}
            {a.activities?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t.activities}</p>
                <div className="flex flex-wrap gap-2">
                  {a.activities.map((act: any, i: number) => {
                    const text = typeof act === 'string' ? act : (act.name || act.details || JSON.stringify(act));
                    return (
                      <span key={i} className="text-sm bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2 rounded-xl text-slate-700 border border-amber-100 font-medium">{text}</span>
                    );
                  })}
                </div>
              </div>
            )}
          </ExpandableSection>
        </div>
      )}

      {/* ═══ PRICES — Split layout ═══ */}
      {a.priceComparison && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <ExpandableSection icon={Wallet} title={t.prices} accent="seafoam">
            <div className="space-y-4">
              {a.priceComparison.thisArea && <p className="text-base text-slate-700 leading-relaxed">{a.priceComparison.thisArea}</p>}

              {a.budgetEstimate && a.budgetEstimate.dailyHigh > 0 && (
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-50 to-emerald-100/30 rounded-xl border border-emerald-100">
                  <div className="text-center">
                    <span className="text-3xl font-black text-emerald-700">&euro;{a.budgetEstimate.dailyLow}-{a.budgetEstimate.dailyHigh}</span>
                    <p className="text-xs text-emerald-600 font-medium">{t.perDay}</p>
                  </div>
                </div>
              )}

              {a.priceComparison.specificPrices?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {a.priceComparison.specificPrices.map((p: string, i: number) => (
                    <span key={i} className="text-sm bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-slate-700 font-medium">{p}</span>
                  ))}
                </div>
              )}

              {a.priceComparison.guestVerdict && (
                <div className="p-4 bg-ocean-50 rounded-xl border border-ocean-100">
                  <p className="text-sm text-ocean-800 font-medium">{a.priceComparison.guestVerdict}</p>
                </div>
              )}
            </div>
          </ExpandableSection>
        </div>
      )}

      {/* ═══ WALKABILITY & PRACTICAL — Icon grid ═══ */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <ExpandableSection icon={Footprints} title={t.walkability} accent="purple">
          {a.walkabilityDescription && (
            <p className="text-base text-slate-700 mb-5 leading-relaxed">{str(a.walkabilityDescription)}</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { key: 'shopping', areaKey: 'supermarkets', icon: ShoppingBag, label: 'Supermarket', color: 'bg-blue-50 border-blue-100 text-blue-700' },
              { key: 'pharmacy', areaKey: 'pharmacies', icon: Shield, label: 'Pharmacy', color: 'bg-rose-50 border-rose-100 text-rose-700' },
              { key: 'doctor', areaKey: 'doctor', icon: Shield, label: 'Doctor', color: 'bg-red-50 border-red-100 text-red-700' },
              { key: 'atm', areaKey: 'atm', icon: Wallet, label: 'ATM', color: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
              { key: 'bakery', areaKey: 'bakery', icon: Coffee, label: 'Bakery', color: 'bg-amber-50 border-amber-100 text-amber-700' },
              { key: 'playground', areaKey: 'playgrounds', icon: Baby, label: 'Playground', color: 'bg-violet-50 border-violet-100 text-violet-700' },
              { key: 'iceCream', areaKey: null, icon: Sparkles, label: 'Ice Cream', color: 'bg-pink-50 border-pink-100 text-pink-700' },
              { key: 'gasStation', areaKey: null, icon: MapPin, label: 'Gas Station', color: 'bg-slate-50 border-slate-200 text-slate-700' },
            ].filter(item => a[item.key] || (item.areaKey && areaData?.[item.areaKey]?.length > 0)).map(item => {
              const Icon = item.icon;
              const areaPlaces = item.areaKey ? areaData?.[item.areaKey] : null;
              const text = a[item.key] || (areaPlaces?.length > 0 ? areaPlaces.map((s: any) => `${s.name} (${s.distance}m)`).join(', ') : '') || '';
              return (
                <div key={item.key} className={`p-3 md:p-4 rounded-xl border ${item.color}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{text}</p>
                </div>
              );
            })}
          </div>

          {/* Town center + Noise */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            {a.townCenterInfo && (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex items-center gap-2 mb-1">
                  <Landmark className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-bold text-amber-800">{t.townCenter}</span>
                </div>
                <p className="text-sm text-slate-600">{str(a.townCenterInfo)}</p>
              </div>
            )}
            {a.noiseAssessment && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-1">
                  <Volume2 className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-bold text-slate-800">{t.noiseLevel}</span>
                </div>
                <p className="text-sm text-slate-600">{str(a.noiseAssessment)}</p>
              </div>
            )}
          </div>
        </ExpandableSection>
      </div>

      {/* ═══ FAMILY & SAFETY ═══ */}
      {a.familySafetyNotes?.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <ExpandableSection icon={Shield} title={t.family} accent="seafoam">
            <ul className="space-y-3">
              {a.familySafetyNotes.map((n: any, i: number) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span className="leading-relaxed">{str(n)}</span>
                </li>
              ))}
            </ul>
            {a.accessibilityReport && (
              <div className="mt-4 mx-1 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <Accessibility className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-bold text-slate-800">{t.accessibility}</span>
                </div>
                <p className="text-sm text-slate-600">Wheelchair: {a.accessibilityReport.wheelchairFriendly}</p>
              </div>
            )}
          </ExpandableSection>
        </div>
      )}

      {/* ═══ HIDDEN GEMS — Highlight cards ═══ */}
      {a.topFinds?.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-3xl border border-amber-100 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-slate-900">{t.hiddenGems}</h3>
          </div>
          <div className="space-y-3">
            {a.topFinds.map((f: any, i: number) => (
              <div key={i} className="flex items-start gap-3 bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-amber-100/50">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-700 leading-relaxed">{str(f)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ GOOGLE RATING ═══ */}
      {accommodation.googleReviews && accommodation.googleReviews.rating > 0 && (
        <div className="flex items-center justify-center gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center gap-1">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <span className="text-lg font-bold text-slate-800">{accommodation.googleReviews.rating}</span>
          </div>
          <span className="text-sm text-slate-500">{t.reviews} {accommodation.googleReviews.reviewCount} {t.reviewsSuffix}</span>
        </div>
      )}

      {/* ═══ QUESTIONS FOR HOST ═══ */}
      {a.questionsForHost?.length > 0 && (
        <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-3xl border border-rose-100 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-slate-900">{t.questions}</h3>
          </div>
          <ol className="space-y-3">
            {a.questionsForHost.map((q: any, i: number) => (
              <li key={i} className="flex items-start gap-3 bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-rose-100/50">
                <div className="w-7 h-7 bg-rose-500 text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">{i + 1}</div>
                <p className="text-sm text-slate-700 leading-relaxed">{str(q)}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* ═══ SEASONAL ADVICE ═══ */}
      {a.seasonalAdvice && (
        <div className="flex items-start gap-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 p-5 md:p-6">
          <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center flex-shrink-0">
            <TreePine className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-emerald-800 mb-1">{t.seasonalTip}</h4>
            <p className="text-sm text-slate-700 leading-relaxed">{str(a.seasonalAdvice)}</p>
          </div>
        </div>
      )}

      {/* ═══ FINAL VERDICT ═══ */}
      {a.finalAdvice && (
        <div className="relative bg-gradient-to-br from-slate-900 via-ocean-900 to-slate-900 rounded-3xl p-6 md:p-10 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-ocean-500/10 rounded-full blur-3xl" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-ocean-500 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-black text-white">{t.finalVerdict}</h3>
            </div>
            <p className="text-base md:text-lg text-white/85 leading-relaxed">{str(a.finalAdvice)}</p>
          </div>
        </div>
      )}

      {/* ═══ ALTERNATIVES ═══ */}
      {a.alternativeAreas?.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <ExpandableSection icon={MapPin} title={t.alternatives} accent="ocean" defaultOpen={false}>
            <div className="space-y-4">
              {a.alternativeAreas.map((alt: any, i: number) => (
                <div key={i} className="p-5 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-100">
                  <h4 className="font-bold text-slate-800 text-base mb-3">{alt.name}</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">{t.pros}</p>
                      {(alt.pros || []).map((p: any, j: number) => (
                        <p key={j} className="text-sm text-slate-600 flex items-start gap-1.5 mb-1">
                          <span className="text-emerald-500 mt-0.5">+</span>{str(p)}
                        </p>
                      ))}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2">{t.cons}</p>
                      {(alt.cons || []).map((c: any, j: number) => (
                        <p key={j} className="text-sm text-slate-600 flex items-start gap-1.5 mb-1">
                          <span className="text-rose-500 mt-0.5">-</span>{str(c)}
                        </p>
                      ))}
                    </div>
                  </div>
                  {alt.bookingSearchQuery && (
                    <a href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(alt.bookingSearchQuery)}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm bg-ocean-500 text-white px-4 py-2 rounded-xl hover:bg-ocean-600 transition-colors font-medium">
                      {t.searchBooking} <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </ExpandableSection>
        </div>
      )}

      {/* ═══ FOOTER ═══ */}
      <p className="text-center text-sm text-slate-400 py-4">
        {t.basedOn} {reviewAnalysis?.totalReviewsAnalyzed || 0} {t.footer}
      </p>
    </div>
  );
}
