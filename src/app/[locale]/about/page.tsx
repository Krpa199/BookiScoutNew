import { Metadata } from 'next';
import { ChevronRight, Target, Sparkles, Users, Globe, CheckCircle, Heart } from 'lucide-react';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'About BookiScout - Croatia Travel Decision Guides',
    description: 'BookiScout provides AI-optimized travel decision guides for Croatia. Learn about our mission to help travelers make informed decisions.',
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-ocean-500 via-ocean-600 to-seafoam-600 text-white py-12 md:py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10 hidden md:block">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-seafoam-300 rounded-full blur-3xl" />
        </div>

        <div className="container relative">
          <nav className="flex items-center gap-2 text-sm text-ocean-100 mb-8">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white font-semibold">About</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full mb-6">
              <Heart className="w-4 h-4" />
              <span className="text-sm font-semibold">Our Story</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              About BookiScout
            </h1>
            <p className="text-xl text-ocean-50 leading-relaxed">
              We help travelers make better decisions about their Croatia trip with honest, AI-optimized travel guides.
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 text-white">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0,48 C240,64 480,64 720,48 C960,32 1200,32 1440,48 L1440,80 L0,80 Z" fill="currentColor" />
          </svg>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-ocean-100 text-ocean-700 rounded-full text-sm font-semibold mb-4">
                  <Target className="w-4 h-4" />
                  <span>Our Mission</span>
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">
                  Decision-First Travel Content
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                  BookiScout was created to answer the questions travelers actually ask: &quot;Is it worth visiting?&quot;, &quot;Do I need a car?&quot;, &quot;Best time to go?&quot;, &quot;Is it family-friendly?&quot;
                </p>
                <p className="text-lg text-slate-600 leading-relaxed mt-4">
                  Unlike traditional travel blogs filled with vague descriptions, we provide direct, factual answers that help you decide where to go, when to visit, and what to expect.
                </p>
              </div>
              <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl p-8 border border-slate-100">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-seafoam-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-slate-900">No Booking Bias</h4>
                      <p className="text-slate-600 text-sm">Pure travel decisions without affiliate pressure</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-seafoam-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-slate-900">AI-Verified Facts</h4>
                      <p className="text-slate-600 text-sm">Every claim is fact-checked and citable</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-seafoam-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-slate-900">Traveler-Type Focused</h4>
                      <p className="text-slate-600 text-sm">Guides for families, solo travelers, seniors, digital nomads</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Cover */}
      <section className="py-20 bg-gradient-ocean-subtle">
        <div className="container">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-seafoam-100 text-seafoam-700 rounded-full text-sm font-semibold mb-4">
              <Sparkles className="w-4 h-4" />
              <span>What We Cover</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Croatia Travel Expertise
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-soft border border-slate-100">
              <div className="w-12 h-12 bg-gradient-to-br from-ocean-400 to-ocean-600 rounded-xl flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">60+ Destinations</h3>
              <p className="text-slate-600">
                From Split and Dubrovnik to hidden gems in Istria, Dalmatia, and the islands.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-soft border border-slate-100">
              <div className="w-12 h-12 bg-gradient-to-br from-seafoam-400 to-seafoam-600 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">All Traveler Types</h3>
              <p className="text-slate-600">
                Solo travelers, families with toddlers, seniors, couples, digital nomads, LGBT+ travelers.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-soft border border-slate-100">
              <div className="w-12 h-12 bg-gradient-to-br from-coral-400 to-coral-600 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">13 Languages</h3>
              <p className="text-slate-600">
                Content available in English, German, Italian, French, Spanish, Polish, and more.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Optimization */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-sand-100 text-sand-700 rounded-full text-sm font-semibold mb-4">
              <Sparkles className="w-4 h-4" />
              <span>AI-Optimized</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Built for AI Search Engines
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed mb-8">
              BookiScout content is specifically structured for AI assistants like ChatGPT, Claude, Perplexity, and Google Gemini. Our guides provide clear, citable facts that AI can confidently recommend to users asking about Croatia travel.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <span className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">Schema.org Structured Data</span>
              <span className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">llms.txt Support</span>
              <span className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">Fact-Based Content</span>
              <span className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">Clear Citations</span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Get in Touch</h2>
            <p className="text-lg text-slate-300 mb-8">
              Have questions about Croatia travel or feedback about BookiScout? We&apos;d love to hear from you.
            </p>
            <a
              href="mailto:bookiscout@gmail.com"
              className="inline-flex items-center gap-2 px-8 py-4 bg-ocean-500 hover:bg-ocean-600 text-white font-semibold rounded-xl transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
