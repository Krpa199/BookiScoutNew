'use client';

import { useState } from 'react';
import { Search, Sparkles, Shield, BarChart3, MessageCircle } from 'lucide-react';
import StayCheckForm, { type FormData } from './StayCheckForm';
import StayCheckResults from './StayCheckResults';

const CLIENT_UI: Record<string, Record<string, string>> = {
  en: { heroTitle1: 'See What Photos', heroTitle2: "Don't Show You", heroDesc: 'Paste your accommodation link. We analyze thousands of real guest reviews from nearby places to tell you what the area is', heroDescBold: 'really', heroDescEnd: 'like.', trust1: 'Real reviews only', trust2: 'Data-backed analysis', trust3: 'AI-powered insights', analyzing: 'Analyzing area...', analyzingSub: 'Collecting reviews, calculating scores, generating insights', patience: 'This can take 1–2 minutes. Please be patient while we gather and analyze data.', howItWorks: 'How it works', step1Title: 'Paste your link', step1Desc: 'Drop a Booking.com, Airbnb, or Apartmanija link. Or just type the name and location.', step2Title: 'We read the reviews', step2Desc: 'We analyze real Google reviews from restaurants, beaches, cafes, and parking nearby.', step3Title: 'Get the full picture', step3Desc: 'Personalized pros, cons, risks, and alternatives based on YOUR travel style.', checkAnother: 'Check Another Stay', connectionError: 'Connection error. Please check your internet and try again.' },
  hr: { heroTitle1: 'Pogledajte što slike', heroTitle2: 'Ne pokazuju', heroDesc: 'Zalijepite link smještaja. Analiziramo tisuće recenzija gostiju obližnjih mjesta da vam kažemo kakav je prostor', heroDescBold: 'stvarno', heroDescEnd: '.', trust1: 'Samo prave recenzije', trust2: 'Analiza temeljena na podacima', trust3: 'AI uvidi', analyzing: 'Analiziramo područje...', analyzingSub: 'Prikupljamo recenzije, računamo ocjene, generiramo uvide', patience: 'Ovo može potrajati 1–2 minute. Molimo pričekajte dok prikupljamo i analiziramo podatke.', howItWorks: 'Kako funkcionira', step1Title: 'Zalijepite link', step1Desc: 'Stavite Booking.com, Airbnb ili Apartmanija link. Ili samo upišite ime i lokaciju.', step2Title: 'Čitamo recenzije', step2Desc: 'Analiziramo prave Google recenzije restorana, plaža, kafića i parkinga u blizini.', step3Title: 'Dobijte potpunu sliku', step3Desc: 'Personalizirane prednosti, nedostaci, rizici i alternative prema VAŠEM stilu putovanja.', checkAnother: 'Provjeri drugi smještaj', connectionError: 'Greška u povezivanju. Provjerite internet i pokušajte ponovo.' },
  de: { heroTitle1: 'Sehen Sie was Fotos', heroTitle2: 'Nicht zeigen', heroDesc: 'Fügen Sie Ihren Unterkunftslink ein. Wir analysieren Tausende echte Gästebewertungen von nahen Orten, um Ihnen zu zeigen, wie die Gegend', heroDescBold: 'wirklich', heroDescEnd: 'ist.', trust1: 'Nur echte Bewertungen', trust2: 'Datengestützte Analyse', trust3: 'KI-gestützte Einblicke', analyzing: 'Bereich wird analysiert...', analyzingSub: 'Bewertungen sammeln, Punktzahlen berechnen, Einblicke generieren', patience: 'Dies kann 1–2 Minuten dauern. Bitte haben Sie Geduld.', howItWorks: 'So funktioniert es', step1Title: 'Link einfügen', step1Desc: 'Booking.com, Airbnb oder Apartmanija Link einfügen. Oder einfach Name und Ort eingeben.', step2Title: 'Wir lesen die Bewertungen', step2Desc: 'Wir analysieren echte Google-Bewertungen von Restaurants, Stränden, Cafés und Parkplätzen.', step3Title: 'Das volle Bild', step3Desc: 'Personalisierte Vor-/Nachteile, Risiken und Alternativen basierend auf IHREM Reisestil.', checkAnother: 'Andere Unterkunft prüfen', connectionError: 'Verbindungsfehler. Überprüfen Sie Ihr Internet.' },
  pl: { heroTitle1: 'Zobacz co zdjęcia', heroTitle2: 'Nie pokazują', heroDesc: 'Wklej link do zakwaterowania. Analizujemy tysiące prawdziwych recenzji gości z pobliskich miejsc, aby powiedzieć Ci jak okolica', heroDescBold: 'naprawdę', heroDescEnd: 'wygląda.', trust1: 'Tylko prawdziwe opinie', trust2: 'Analiza oparta na danych', trust3: 'Wnioski AI', analyzing: 'Analizujemy okolicę...', analyzingSub: 'Zbieramy opinie, obliczamy wyniki, generujemy wnioski', patience: 'To może zająć 1–2 minuty. Prosimy o cierpliwość.', howItWorks: 'Jak to działa', step1Title: 'Wklej link', step1Desc: 'Wklej link z Booking.com, Airbnb lub Apartmanija. Lub po prostu wpisz nazwę i lokalizację.', step2Title: 'Czytamy recenzje', step2Desc: 'Analizujemy prawdziwe opinie Google z restauracji, plaż, kawiarni i parkingów w pobliżu.', step3Title: 'Pełny obraz', step3Desc: 'Spersonalizowane zalety, wady, ryzyka i alternatywy na podstawie TWOJEGO stylu podróży.', checkAnother: 'Sprawdź inny nocleg', connectionError: 'Błąd połączenia. Sprawdź internet i spróbuj ponownie.' },
  cz: { heroTitle1: 'Podívejte se co fotky', heroTitle2: 'Neukazují', heroDesc: 'Vložte odkaz na ubytování. Analyzujeme tisíce skutečných recenzí hostů z okolních míst, abychom vám řekli, jak oblast', heroDescBold: 'opravdu', heroDescEnd: 'vypadá.', trust1: 'Pouze skutečné recenze', trust2: 'Analýza založená na datech', trust3: 'AI postřehy', analyzing: 'Analyzujeme oblast...', analyzingSub: 'Shromažďujeme recenze, počítáme skóre, generujeme postřehy', patience: 'Toto může trvat 1–2 minuty. Prosím buďte trpěliví.', howItWorks: 'Jak to funguje', step1Title: 'Vložte odkaz', step1Desc: 'Vložte odkaz z Booking.com, Airbnb nebo Apartmanija. Nebo jednoduše zadejte název a místo.', step2Title: 'Čteme recenze', step2Desc: 'Analyzujeme skutečné Google recenze restaurací, pláží, kaváren a parkovišť v okolí.', step3Title: 'Úplný obraz', step3Desc: 'Personalizované výhody, nevýhody, rizika a alternativy na základě VAŠEHO cestovního stylu.', checkAnother: 'Zkontrolovat jiné ubytování', connectionError: 'Chyba připojení. Zkontrolujte internet a zkuste to znovu.' },
  it: { heroTitle1: 'Scopri cosa le foto', heroTitle2: 'Non mostrano', heroDesc: "Incolla il link del tuo alloggio. Analizziamo migliaia di recensioni reali degli ospiti dei luoghi vicini per dirti com'è", heroDescBold: 'davvero', heroDescEnd: "la zona.", trust1: 'Solo recensioni vere', trust2: 'Analisi basata sui dati', trust3: 'Approfondimenti AI', analyzing: "Analisi dell'area...", analyzingSub: 'Raccolta recensioni, calcolo punteggi, generazione approfondimenti', patience: 'Questo può richiedere 1–2 minuti. Per favore sii paziente.', howItWorks: 'Come funziona', step1Title: 'Incolla il link', step1Desc: 'Inserisci un link Booking.com, Airbnb o Apartmanija. O semplicemente digita nome e posizione.', step2Title: 'Leggiamo le recensioni', step2Desc: 'Analizziamo le recensioni Google reali di ristoranti, spiagge, caffè e parcheggi nelle vicinanze.', step3Title: 'Il quadro completo', step3Desc: 'Pro, contro, rischi e alternative personalizzati in base al TUO stile di viaggio.', checkAnother: 'Controlla un altro alloggio', connectionError: 'Errore di connessione. Controlla la tua connessione internet.' },
  hu: { heroTitle1: 'Nézd meg amit a fotók', heroTitle2: 'Nem mutatnak', heroDesc: 'Illeszd be a szállás linkjét. Elemezzük a közeli helyek ezernyi valós vendégvéleményét, hogy megmondjuk milyen a környék', heroDescBold: 'valójában', heroDescEnd: '.', trust1: 'Csak valós vélemények', trust2: 'Adatalapú elemzés', trust3: 'AI elemzések', analyzing: 'Terület elemzése...', analyzingSub: 'Vélemények gyűjtése, pontszámok számítása, elemzések generálása', patience: 'Ez 1–2 percig tarthat. Kérjük légy türelmes.', howItWorks: 'Hogyan működik', step1Title: 'Illeszd be a linket', step1Desc: 'Booking.com, Airbnb vagy Apartmanija link. Vagy egyszerűen írd be a nevet és helyet.', step2Title: 'Olvassuk a véleményeket', step2Desc: 'Elemezzük a közeli éttermek, strandok, kávézók és parkolók valós Google véleményeit.', step3Title: 'A teljes kép', step3Desc: 'Személyre szabott előnyök, hátrányok, kockázatok és alternatívák a TE utazási stílusod alapján.', checkAnother: 'Másik szállás ellenőrzése', connectionError: 'Kapcsolódási hiba. Ellenőrizd az interneted.' },
  sk: { heroTitle1: 'Pozrite sa čo fotky', heroTitle2: 'Neukazujú', heroDesc: 'Vložte odkaz na ubytovanie. Analyzujeme tisíce skutočných recenzií hostí z okolitých miest, aby sme vám povedali aká je oblasť', heroDescBold: 'naozaj', heroDescEnd: '.', trust1: 'Iba skutočné recenzie', trust2: 'Analýza založená na dátach', trust3: 'AI postrehy', analyzing: 'Analyzujeme oblasť...', analyzingSub: 'Zhromažďujeme recenzie, počítame skóre, generujeme postrehy', patience: 'Toto môže trvať 1–2 minúty. Prosím buďte trpezliví.', howItWorks: 'Ako to funguje', step1Title: 'Vložte odkaz', step1Desc: 'Vložte odkaz z Booking.com, Airbnb alebo Apartmanija. Alebo jednoducho zadajte názov a miesto.', step2Title: 'Čítame recenzie', step2Desc: 'Analyzujeme skutočné Google recenzie reštaurácií, pláží, kaviarní a parkovísk v okolí.', step3Title: 'Úplný obraz', step3Desc: 'Personalizované výhody, nevýhody, riziká a alternatívy na základe VÁŠHO cestovného štýlu.', checkAnother: 'Skontrolovať iné ubytovanie', connectionError: 'Chyba pripojenia. Skontrolujte internet.' },
  nl: { heroTitle1: "Zie wat foto's", heroTitle2: 'Niet laten zien', heroDesc: 'Plak je accommodatielink. We analyseren duizenden echte gastbeoordelingen van nabijgelegen plaatsen om je te vertellen hoe de omgeving', heroDescBold: 'echt', heroDescEnd: 'is.', trust1: 'Alleen echte reviews', trust2: 'Data-gedreven analyse', trust3: 'AI-inzichten', analyzing: 'Omgeving analyseren...', analyzingSub: 'Beoordelingen verzamelen, scores berekenen, inzichten genereren', patience: 'Dit kan 1–2 minuten duren. Even geduld alsjeblieft.', howItWorks: 'Hoe het werkt', step1Title: 'Plak je link', step1Desc: 'Plak een Booking.com, Airbnb of Apartmanija link. Of typ gewoon de naam en locatie.', step2Title: 'We lezen de reviews', step2Desc: 'We analyseren echte Google reviews van restaurants, stranden, cafés en parkeren in de buurt.', step3Title: 'Het volledige beeld', step3Desc: 'Gepersonaliseerde voor-/nadelen, risico\'s en alternatieven op basis van JOUW reisstijl.', checkAnother: 'Andere accommodatie checken', connectionError: 'Verbindingsfout. Controleer je internet.' },
  sl: { heroTitle1: 'Poglejte kaj slike', heroTitle2: 'Ne pokažejo', heroDesc: 'Prilepite povezavo nastanitve. Analiziramo tisoče resničnih mnenj gostov iz bližnjih krajev, da vam povemo kakšno je okolje', heroDescBold: 'v resnici', heroDescEnd: '.', trust1: 'Samo resnične ocene', trust2: 'Analiza na podlagi podatkov', trust3: 'AI vpogledi', analyzing: 'Analiziramo območje...', analyzingSub: 'Zbiramo ocene, računamo rezultate, ustvarjamo vpoglede', patience: 'To lahko traja 1–2 minuti. Prosimo za potrpljenje.', howItWorks: 'Kako deluje', step1Title: 'Prilepite povezavo', step1Desc: 'Vstavite Booking.com, Airbnb ali Apartmanija povezavo. Ali preprosto vpišite ime in lokacijo.', step2Title: 'Beremo ocene', step2Desc: 'Analiziramo resnične Google ocene restavracij, plaž, kavarn in parkirišč v bližini.', step3Title: 'Celotna slika', step3Desc: 'Prilagojene prednosti, slabosti, tveganja in alternative glede na VAŠ potovalni stil.', checkAnother: 'Preveri drugo nastanitev', connectionError: 'Napaka pri povezavi. Preverite internet.' },
  fr: { heroTitle1: 'Découvrez ce que les photos', heroTitle2: 'Ne montrent pas', heroDesc: "Collez votre lien d'hébergement. Nous analysons des milliers d'avis réels de clients des lieux proches pour vous dire comment est le quartier", heroDescBold: 'vraiment', heroDescEnd: '.', trust1: 'Avis réels uniquement', trust2: 'Analyse basée sur les données', trust3: 'Analyses par IA', analyzing: 'Analyse de la zone...', analyzingSub: 'Collecte des avis, calcul des scores, génération des analyses', patience: 'Cela peut prendre 1–2 minutes. Merci de patienter.', howItWorks: 'Comment ça marche', step1Title: 'Collez votre lien', step1Desc: "Collez un lien Booking.com, Airbnb ou Apartmanija. Ou tapez simplement le nom et l'emplacement.", step2Title: 'Nous lisons les avis', step2Desc: 'Nous analysons les vrais avis Google des restaurants, plages, cafés et parkings à proximité.', step3Title: 'Le tableau complet', step3Desc: 'Avantages, inconvénients, risques et alternatives personnalisés selon VOTRE style de voyage.', checkAnother: "Vérifier un autre hébergement", connectionError: 'Erreur de connexion. Vérifiez votre connexion internet.' },
  es: { heroTitle1: 'Descubre lo que las fotos', heroTitle2: 'No muestran', heroDesc: 'Pega el enlace de tu alojamiento. Analizamos miles de reseñas reales de huéspedes de lugares cercanos para decirte cómo es la zona', heroDescBold: 'realmente', heroDescEnd: '.', trust1: 'Solo reseñas reales', trust2: 'Análisis basado en datos', trust3: 'Insights con IA', analyzing: 'Analizando zona...', analyzingSub: 'Recopilando reseñas, calculando puntuaciones, generando insights', patience: 'Esto puede tardar 1–2 minutos. Por favor ten paciencia.', howItWorks: 'Cómo funciona', step1Title: 'Pega tu enlace', step1Desc: 'Pega un enlace de Booking.com, Airbnb o Apartmanija. O simplemente escribe el nombre y ubicación.', step2Title: 'Leemos las reseñas', step2Desc: 'Analizamos reseñas reales de Google de restaurantes, playas, cafés y aparcamientos cercanos.', step3Title: 'La imagen completa', step3Desc: 'Ventajas, desventajas, riesgos y alternativas personalizados según TU estilo de viaje.', checkAnother: 'Verificar otro alojamiento', connectionError: 'Error de conexión. Comprueba tu internet.' },
  ru: { heroTitle1: 'Узнайте что фото', heroTitle2: 'Не показывают', heroDesc: 'Вставьте ссылку на жильё. Мы анализируем тысячи реальных отзывов гостей из ближайших мест, чтобы рассказать вам какой район', heroDescBold: 'на самом деле', heroDescEnd: '.', trust1: 'Только реальные отзывы', trust2: 'Анализ на основе данных', trust3: 'AI-аналитика', analyzing: 'Анализируем район...', analyzingSub: 'Собираем отзывы, рассчитываем оценки, генерируем выводы', patience: 'Это может занять 1–2 минуты. Пожалуйста, подождите.', howItWorks: 'Как это работает', step1Title: 'Вставьте ссылку', step1Desc: 'Вставьте ссылку Booking.com, Airbnb или Apartmanija. Или просто введите название и местоположение.', step2Title: 'Мы читаем отзывы', step2Desc: 'Мы анализируем реальные отзывы Google ресторанов, пляжей, кафе и парковок поблизости.', step3Title: 'Полная картина', step3Desc: 'Персонализированные плюсы, минусы, риски и альтернативы на основе ВАШЕГО стиля путешествия.', checkAnother: 'Проверить другое жильё', connectionError: 'Ошибка соединения. Проверьте интернет.' },
};

export default function StayCheckClient({ locale = 'en' }: { locale?: string }) {
  const t = CLIENT_UI[locale] || CLIENT_UI.en;
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Parameters<typeof StayCheckResults>[0]['data'] | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await fetch('/api/stay-check/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accommodationName: formData.accommodationName,
          location: formData.location,
          address: formData.address,
          locale,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setResults(data);
    } catch {
      setError(t.connectionError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-ocean-500 via-ocean-400 to-coral-400 text-white">
        <div className="absolute inset-0 opacity-15">
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="stay-check-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="2" fill="white" opacity="0.3" />
                <circle cx="60" cy="60" r="1.5" fill="white" opacity="0.2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#stay-check-pattern)" />
          </svg>
        </div>

        <div className="container relative py-12 md:py-16 lg:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-md rounded-full mb-6 shadow-soft">
              <Search className="w-4 h-4" />
              <span className="text-sm font-semibold">Stay Check</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              {t.heroTitle1}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-sand-200 to-white">
                {t.heroTitle2}
              </span>
            </h1>

            <p className="text-lg md:text-xl text-ocean-50 mb-8 max-w-2xl mx-auto leading-relaxed">
              {t.heroDesc} <strong>{t.heroDescBold}</strong> {t.heroDescEnd}
            </p>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm mb-8">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <Shield className="w-4 h-4" />
                <span>{t.trust1}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <BarChart3 className="w-4 h-4" />
                <span>{t.trust2}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <Sparkles className="w-4 h-4" />
                <span>{t.trust3}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0 text-slate-50">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-8 sm:h-auto" preserveAspectRatio="none">
            <path d="M0,64 C240,100 480,100 720,64 C960,28 1200,28 1440,64 L1440,120 L0,120 Z" fill="currentColor" />
          </svg>
        </div>
      </section>

      {/* Content */}
      <section className="py-8 md:py-12">
        <div className="container">
          {!results ? (
            <>
              <StayCheckForm onSubmit={handleSubmit} isLoading={isLoading} locale={locale} />

              {error && (
                <div className="max-w-2xl mx-auto mt-6 p-4 bg-coral-50 border border-coral-200 rounded-2xl text-center">
                  <p className="text-coral-700 text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Loading state with steps */}
              {isLoading && (
                <div className="max-w-2xl mx-auto mt-8 text-center animate-fade-in space-y-4">
                  <div className="inline-flex items-center gap-3 px-6 py-4 bg-ocean-50 rounded-2xl">
                    <div className="w-6 h-6 border-3 border-ocean-200 border-t-ocean-600 rounded-full animate-spin" />
                    <div className="text-left">
                      <p className="text-sm font-bold text-ocean-700">{t.analyzing}</p>
                      <p className="text-xs text-ocean-500">{t.analyzingSub}</p>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 px-5 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
                    <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-amber-700 font-medium">{t.patience}</p>
                  </div>
                </div>
              )}

              {/* How it works */}
              {!isLoading && (
                <div className="max-w-3xl mx-auto mt-16 md:mt-20">
                  <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">{t.howItWorks}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      {
                        icon: Search,
                        title: t.step1Title,
                        description: t.step1Desc,
                        color: 'ocean',
                      },
                      {
                        icon: MessageCircle,
                        title: t.step2Title,
                        description: t.step2Desc,
                        color: 'seafoam',
                      },
                      {
                        icon: BarChart3,
                        title: t.step3Title,
                        description: t.step3Desc,
                        color: 'coral',
                      },
                    ].map((step, i) => {
                      const Icon = step.icon;
                      const colors: Record<string, string> = {
                        ocean: 'from-ocean-400 to-ocean-600',
                        seafoam: 'from-seafoam-400 to-seafoam-600',
                        coral: 'from-coral-400 to-coral-600',
                      };
                      return (
                        <div key={i} className="text-center">
                          <div className={`w-14 h-14 bg-gradient-to-br ${colors[step.color]} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-soft`}>
                            <Icon className="w-7 h-7 text-white" />
                          </div>
                          <h3 className="font-bold text-slate-900 mb-2">{step.title}</h3>
                          <p className="text-sm text-slate-500">{step.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm"
                >
                  {t.checkAnother}
                </button>
              </div>
              <StayCheckResults data={results} locale={locale} />
            </>
          )}
        </div>
      </section>
    </div>
  );
}
