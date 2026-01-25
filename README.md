# BookiScout 🏖️

AI-powered Croatia travel guide optimized for AI search engines (ChatGPT, Perplexity, Claude).

## Features

- 🤖 **AI SEO Optimized** - Structured for AI search engine citations
- 🌍 **11 Languages** - EN, DE, PL, CZ, IT, HU, SK, NL, SI, FR, HR
- 📝 **Auto-Generated Articles** - Daily article generation via GitHub Actions
- ⚡ **Static Site Generation** - Fast, SEO-friendly pages
- 🎨 **Modern Design** - Airbnb-inspired UI

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Generate articles (requires GEMINI_API_KEY)
npm run generate
```

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
GEMINI_API_KEY=your_gemini_api_key
ARTICLES_PER_RUN=10
```

## Article Generation

Articles are automatically generated daily via GitHub Actions.

Manual generation:
```bash
npm run generate
```

## Deployment

Deploy to Vercel:

```bash
npx vercel
```

## Stats

- 60+ Croatian destinations
- 20 article themes per destination
- 11 languages = 13,200+ potential pages

## License

MIT
