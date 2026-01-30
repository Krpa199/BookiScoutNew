# 🖼️ BookiScout Image Strategy

**Datum:** 2026-01-27
**Status:** ✅ IMPLEMENTED

---

## 🚫 GOOGLE MAPS - NE KORISTITI!

### Zašto Google Maps slike NE SMIJEMO koristiti:

❌ **Nije besplatno za komercijalne svrhe:**
- Google Maps API Terms zabranjuje screenshot-ove i export slika za komercijalne web stranice
- Potrebna je eksplicitna dozvola od Google-a
- Slike su vlasništvo Google-a

❌ **Pravni rizici:**
- Copyright infringement (kršenje autorskih prava)
- Google može zatražiti uklanjanje sadržaja
- Moguće sudske takse i kazne

⚠️ **"Ali puno ljudi objavljuje slike sa Google Maps":**
- To je **nelegalno** i krši Google Terms of Service
- Ljudi to rade pogrešno, ne znači da je dozvoljeno
- Veće stranice koje to rade imaju **licencne dogovore** s Google-om

---

## ✅ PREPORUČENE BESPLATNE ALTERNATIVE

### 1. Unsplash (GLAVNI IZVOR) ⭐

**Zašto:**
- ✅ Potpuno besplatno za komercijalne svrhe
- ✅ Atribucija nije obavezna (ali je lijepa gesta)
- ✅ Visoka kvaliteta fotografija
- ✅ API dostupan (1000 requests/sat)

**Kako koristimo:**
```typescript
// src/config/images.ts
'split': {
  url: 'https://images.unsplash.com/photo-{ID}?w=800&q=80',
  alt: 'Split, Croatia - Diocletian Palace waterfront',
  credit: 'Unsplash',
},
```

**Pronalaženje photo ID-ja:**
1. Idi na [unsplash.com](https://unsplash.com)
2. Traži "Split Croatia" ili bilo koju destinaciju
3. Klikni na sliku
4. URL će biti: `unsplash.com/photos/ABC123xyz`
5. Koristi taj ID: `photo-ABC123xyz`

---

### 2. Pexels (BACKUP)

**Zašto:**
- ✅ Besplatno za komercijalne svrhe
- ✅ Dobra kvaliteta
- ✅ API dostupan

**Format:**
```
https://images.pexels.com/photos/{ID}/pexels-photo-{ID}.jpeg?auto=compress&w=800&q=80
```

---

### 3. Wikimedia Commons (FALLBACK)

**Zašto:**
- ✅ Besplatno
- ✅ Puno historijskih slika
- ⚠️ **Obavezna atribucija** (mora se navesti autor i licenca)

**Kako koristiti:**
```bash
# Fetch images from Wikimedia
npm run fetch-images split
npm run fetch-images --all
```

**Script:** `scripts/fetch-wikimedia-images.ts`

**Atribucija (primjer):**
```tsx
<img src="..." alt="..." />
<p className="text-xs text-gray-500">
  Photo by AuthorName, CC BY-SA 4.0, via Wikimedia Commons
</p>
```

---

## 📂 TRENUTNA IMPLEMENTACIJA

### Fajl: [src/config/images.ts](src/config/images.ts)

```typescript
export interface DestinationImage {
  url: string;
  alt: string;
  credit?: string;
}

const DESTINATION_IMAGES: Record<string, DestinationImage> = {
  'split': {
    url: 'https://images.unsplash.com/photo-1555990538-1e6c0a6df7d3?w=800&q=80',
    alt: 'Split, Croatia - Diocletian Palace waterfront',
    credit: 'Unsplash',
  },
  'dubrovnik': {
    url: 'https://images.unsplash.com/photo-1584528833896-05d22e4f9ba2?w=800&q=80',
    alt: 'Dubrovnik Old Town walls and red roofs',
    credit: 'Unsplash',
  },
  // ... (35+ destinacija)
};

export function getDestinationImage(slug: string): DestinationImage {
  return DESTINATION_IMAGES[slug] || DEFAULT_IMAGE;
}
```

### Destinacije pokrivene (40+ lokacija):

**Major Cities:**
- Split, Dubrovnik, Zagreb, Zadar, Rijeka, Pula

**Istria:**
- Rovinj, Poreč, Umag, Motovun

**Kvarner:**
- Opatija, Krk, Rab, Lošinj

**Dalmatia:**
- Šibenik, Trogir, Makarska, Brela

**Islands:**
- Hvar, Brač, Korčula, Vis, Bol

**National Parks:**
- Plitvice, Krka, Kornati, Brijuni

**Dubrovnik Region:**
- Cavtat

---

## 🎨 AI-GENERIRANE SLIKE (GEMINI) - SELECTIVE USE

### Kada koristiti AI slike (Gemini):

✅ **DA:**
- **Karte regija** (infografike koje ne postoje u realnim slikama)
- **Dijagrami i usporedbe** (npr. "Split vs Dubrovnik comparison")
- **Custom ilustracije** (npr. icons, abstract backgrounds)
- **Sezonski grafikoni** (temperature, posjetitelji)

❌ **NE:**
- **Hero slike destinacija** (AI detection → SEO penalty)
- **Plaže i monumenti** (realne slike bolje za trust)
- **People/faces** (AI često loše izgleda)

---

### Zašto ne koristiti AI za sve:

1. **SEO problemi:**
   - Google može detektirati AI slike
   - Preferencija se daje realnim fotografijama
   - AI slike imaju manje autentičnosti

2. **Trust issues:**
   - Posjetitelji žele vidjeti **realne** slike destinacija
   - AI može imati "uncanny valley" efekt
   - Konkurenti koriste realne slike

3. **Quality issues:**
   - AI često loše radi s tekstom u slikama
   - Arhitekturni detalji mogu biti pogrešni
   - Colours ponekad nerealistične

---

### Hybrid pristup (PREPORUČENO):

```
📸 REAL PHOTOS (Unsplash/Pexels):
├── Hero images (destinations pages)
├── Beach photos
├── City landmarks
└── Restaurants/apartments

🎨 AI-GENERATED (Gemini):
├── Regional maps
├── Infographics
├── Comparison charts
└── Abstract backgrounds
```

---

## 🛠️ KAKO DODATI NOVE SLIKE

### Opcija 1: Unsplash (PREPORUČENO)

1. **Idi na [unsplash.com](https://unsplash.com)**
2. **Traži destinaciju** (npr. "Hvar Croatia")
3. **Kopiraj photo ID** iz URL-a
4. **Dodaj u `src/config/images.ts`:**

```typescript
'hvar': {
  url: 'https://images.unsplash.com/photo-{ID}?w=800&q=80',
  alt: 'Hvar town harbor and fortress',
  credit: 'Unsplash',
},
```

---

### Opcija 2: Wikimedia Commons (sa atribucijom)

1. **Fetch images:**
```bash
npm run fetch-images hvar
```

2. **Kopiraj URL iz outputa**
3. **Dodaj atribuciju:**

```typescript
'hvar': {
  url: 'https://upload.wikimedia.org/...',
  alt: 'Hvar town harbor',
  credit: 'Photo by AuthorName, CC BY-SA 4.0',
},
```

---

### Opcija 3: Pexels (backup)

1. **Idi na [pexels.com](https://pexels.com)**
2. **Traži destinaciju**
3. **Kopiraj Photo ID**
4. **Dodaj:**

```typescript
'destination': {
  url: 'https://images.pexels.com/photos/{ID}/pexels-photo-{ID}.jpeg?auto=compress&w=800&q=80',
  alt: 'Description',
  credit: 'Pexels',
},
```

---

## 📊 OPTIMIZACIJA SLIKA

### URL parametri (Unsplash):

```
?w=800       → širina 800px
&q=80        → kvaliteta 80%
&fit=crop    → crop na aspect ratio
&auto=format → automatski WebP/AVIF
```

### Responsive slike:

```tsx
<img
  src={`${image.url}?w=800&q=80`}
  srcSet={`
    ${image.url}?w=400&q=80 400w,
    ${image.url}?w=800&q=80 800w,
    ${image.url}?w=1200&q=80 1200w
  `}
  sizes="(max-width: 768px) 400px, (max-width: 1200px) 800px, 1200px"
  alt={image.alt}
  loading="lazy"
/>
```

---

## ✅ PRAVNA SIGURNOST

### Unsplash & Pexels:
- ✅ Besplatno za komercijalne svrhe
- ✅ Atribucija nije obavezna
- ✅ Možeš modificirati slike
- ✅ Nema pravnih rizika

### Wikimedia Commons:
- ✅ Besplatno za komercijalne svrhe
- ⚠️ **OBAVEZNA atribucija** (autor + licenca)
- ✅ Možeš modificirati (ovisno o licenci)

### Google Maps:
- ❌ **NE KORISTITI** bez licence
- ❌ Pravni rizici
- ❌ Copyright violations

---

## 📝 CHECKLIST ZA DODAVANJE SLIKA

- [ ] Provjeri je li slika **free for commercial use**
- [ ] Koristi **Unsplash ili Pexels** za hero slike
- [ ] Dodaj **opisni alt text** (SEO + accessibility)
- [ ] Dodaj **credit** (Unsplash/Pexels/Wikimedia)
- [ ] Optimiziraj URL parametre (`?w=800&q=80`)
- [ ] Testiraj da slike rade (404 check)
- [ ] Ako koristiš Wikimedia, dodaj **atribuciju**

---

## 🎯 SLJEDEĆI KORACI

### Faza 1: Zamijeni sve placeholder slike ✅
- [x] Unsplash photo IDs dodati u images.ts
- [x] 40+ destinacija pokriveno

### Faza 2: Dodaj više slika po destinaciji
- [ ] Hero slika (destination page)
- [ ] 3-5 gallery slika (beaches, landmarks)
- [ ] Neighbourhood thumbnails

### Faza 3: AI infografike (opciono)
- [ ] Regional maps (Gemini)
- [ ] Comparison charts
- [ ] Weather/season graphics

### Faza 4: Image CDN (opciono)
- [ ] Razmisli o Cloudinary/Imgix za caching
- [ ] WebP/AVIF conversion
- [ ] Lazy loading optimization

---

## 🎉 ZAKLJUČAK

**Image strategija:**

✅ **Unsplash (glavni)** → Hero slike, destinacije, landmarks
✅ **Pexels (backup)** → Dodatne fotografije
✅ **Wikimedia Commons (fallback)** → Historijske slike (s atribucijom)
✅ **AI-generated (selective)** → Karte, infografike, dijagrami

❌ **Google Maps** → **NE KORISTITI** (nije legalno)

**Status:** 🎉 **PRODUCTION READY**

---

**Datum:** 2026-01-27
**Status:** ✅ COMPLETE
