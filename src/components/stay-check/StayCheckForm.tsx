'use client';

import { useState } from 'react';
import { Search, MapPin, Loader2, Home } from 'lucide-react';

interface StayCheckFormProps {
  onSubmit: (data: FormData) => void;
  isLoading: boolean;
  locale?: string;
}

export interface FormData {
  accommodationName: string;
  location: string;
  address: string;
}

const FORM_UI: Record<string, Record<string, string>> = {
  en: { title: 'Check Your Stay', desc: 'Enter accommodation details and we\'ll analyze the area for you', namePlaceholder: 'Accommodation name (e.g., Villa Bilic)', locationPlaceholder: 'Town / City (e.g., Marina)', addressPlaceholder: 'Address (optional, for more accurate results)', analyze: 'Analyze This Stay', analyzing: 'Analyzing...' },
  hr: { title: 'Provjeri smještaj', desc: 'Unesite podatke o smještaju i analizirat ćemo područje za vas', namePlaceholder: 'Naziv smještaja (npr. Villa Bilic)', locationPlaceholder: 'Mjesto (npr. Marina)', addressPlaceholder: 'Adresa (opcionalno, za točnije rezultate)', analyze: 'Analiziraj smještaj', analyzing: 'Analiziramo...' },
  de: { title: 'Unterkunft prüfen', desc: 'Geben Sie die Unterkunftsdaten ein und wir analysieren die Umgebung', namePlaceholder: 'Name der Unterkunft (z.B. Villa Bilic)', locationPlaceholder: 'Ort (z.B. Marina)', addressPlaceholder: 'Adresse (optional, für genauere Ergebnisse)', analyze: 'Unterkunft analysieren', analyzing: 'Wird analysiert...' },
  it: { title: 'Controlla il soggiorno', desc: "Inserisci i dati dell'alloggio e analizzeremo la zona", namePlaceholder: "Nome dell'alloggio (es. Villa Bilic)", locationPlaceholder: 'Città (es. Marina)', addressPlaceholder: 'Indirizzo (opzionale, per risultati più precisi)', analyze: 'Analizza alloggio', analyzing: 'Analisi in corso...' },
  fr: { title: 'Vérifier le séjour', desc: "Entrez les détails de l'hébergement et nous analyserons la zone", namePlaceholder: "Nom de l'hébergement (ex. Villa Bilic)", locationPlaceholder: 'Ville (ex. Marina)', addressPlaceholder: 'Adresse (optionnel, pour des résultats plus précis)', analyze: 'Analyser le séjour', analyzing: 'Analyse en cours...' },
  es: { title: 'Verificar alojamiento', desc: 'Introduce los datos del alojamiento y analizaremos la zona', namePlaceholder: 'Nombre del alojamiento (ej. Villa Bilic)', locationPlaceholder: 'Ciudad (ej. Marina)', addressPlaceholder: 'Dirección (opcional, para resultados más precisos)', analyze: 'Analizar alojamiento', analyzing: 'Analizando...' },
  pl: { title: 'Sprawdź nocleg', desc: 'Wprowadź dane zakwaterowania, a my przeanalizujemy okolicę', namePlaceholder: 'Nazwa (np. Villa Bilic)', locationPlaceholder: 'Miasto (np. Marina)', addressPlaceholder: 'Adres (opcjonalnie, dla dokładniejszych wyników)', analyze: 'Analizuj nocleg', analyzing: 'Analizowanie...' },
  cz: { title: 'Zkontrolovat ubytování', desc: 'Zadejte údaje o ubytování a my analyzujeme okolí', namePlaceholder: 'Název (např. Villa Bilic)', locationPlaceholder: 'Město (např. Marina)', addressPlaceholder: 'Adresa (volitelné, pro přesnější výsledky)', analyze: 'Analyzovat ubytování', analyzing: 'Analyzuji...' },
  hu: { title: 'Szállás ellenőrzése', desc: 'Add meg a szállás adatait és elemezzük a környéket', namePlaceholder: 'Szállás neve (pl. Villa Bilic)', locationPlaceholder: 'Város (pl. Marina)', addressPlaceholder: 'Cím (opcionális, pontosabb eredményekért)', analyze: 'Szállás elemzése', analyzing: 'Elemzés...' },
  sk: { title: 'Skontrolovať ubytovanie', desc: 'Zadajte údaje o ubytovaní a my analyzujeme okolie', namePlaceholder: 'Názov (napr. Villa Bilic)', locationPlaceholder: 'Mesto (napr. Marina)', addressPlaceholder: 'Adresa (voliteľné, pre presnejšie výsledky)', analyze: 'Analyzovať ubytovanie', analyzing: 'Analyzujem...' },
  nl: { title: 'Accommodatie checken', desc: 'Voer de accommodatiegegevens in en we analyseren de omgeving', namePlaceholder: 'Naam (bijv. Villa Bilic)', locationPlaceholder: 'Stad (bijv. Marina)', addressPlaceholder: 'Adres (optioneel, voor nauwkeurigere resultaten)', analyze: 'Analyseer accommodatie', analyzing: 'Analyseren...' },
  sl: { title: 'Preveri nastanitev', desc: 'Vnesite podatke o nastanitvi in analizirali bomo območje', namePlaceholder: 'Ime (npr. Villa Bilic)', locationPlaceholder: 'Mesto (npr. Marina)', addressPlaceholder: 'Naslov (neobvezno, za natančnejše rezultate)', analyze: 'Analiziraj nastanitev', analyzing: 'Analiziramo...' },
  ru: { title: 'Проверить жильё', desc: 'Введите данные жилья и мы проанализируем район', namePlaceholder: 'Название (напр. Villa Bilic)', locationPlaceholder: 'Город (напр. Marina)', addressPlaceholder: 'Адрес (необязательно, для более точных результатов)', analyze: 'Анализировать жильё', analyzing: 'Анализируем...' },
};

export default function StayCheckForm({ onSubmit, isLoading, locale = 'en' }: StayCheckFormProps) {
  const t = FORM_UI[locale] || FORM_UI.en;
  const [accommodationName, setAccommodationName] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');

  const canSubmit = accommodationName.length > 2 && location.length > 2;

  const handleSubmit = () => {
    if (canSubmit && !isLoading) {
      onSubmit({ accommodationName, location, address });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="animate-fade-in">
        <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">
          {t.title}
        </h2>
        <p className="text-slate-500 mb-6 text-center">
          {t.desc}
        </p>

        <div className="space-y-3">
          <div className="relative">
            <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={accommodationName}
              onChange={e => setAccommodationName(e.target.value)}
              placeholder={t.namePlaceholder}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-200 focus:border-ocean-400 focus:ring-4 focus:ring-ocean-100 outline-none text-slate-900 text-base transition-all"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder={t.locationPlaceholder}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-200 focus:border-ocean-400 focus:ring-4 focus:ring-ocean-100 outline-none text-slate-900 text-base transition-all"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder={t.addressPlaceholder}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-ocean-400 focus:ring-4 focus:ring-ocean-100 outline-none text-slate-900 text-base transition-all bg-slate-50/50"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isLoading}
          className="w-full mt-6 py-4 bg-gradient-to-r from-ocean-500 to-ocean-600 text-white font-bold rounded-2xl hover:from-ocean-600 hover:to-ocean-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-ocean"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t.analyzing}
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              {t.analyze}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
