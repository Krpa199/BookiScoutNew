import Link from 'next/link';
import { Search, MapPin, Sparkles, TrendingUp, Star, ArrowRight, Waves, Sun, Compass, Award, Users, Shield, CheckCircle, HelpCircle, Clock, Car, Baby, Accessibility } from 'lucide-react';
import DestinationCard from '@/components/ui/DestinationCard';
import ArticleCard from '@/components/ui/ArticleCard';
import { DESTINATIONS } from '@/config/destinations';

export default function HomePage() {
  const popularDestinations = DESTINATIONS.filter(d => d.popular).slice(0, 6);

  // AI Decision-focused featured guides (no booking/apartments intent)
  const featuredArticles = [
    {
      title: 'Is Split Good for Solo Travelers?',
      description: 'Find out if Split is the right choice for independent travelers: safety, walkability, social scene, and practical tips.',
      destination: 'split',
      destinationName: 'Split',
      theme: 'solo-travel',
      language: 'en',
    },
    {
      title: 'Do You Need a Car in Dubrovnik?',
      description: 'Complete breakdown of getting around Dubrovnik: when a car helps, when it\'s a burden, and the best alternatives.',
      destination: 'dubrovnik',
      destinationName: 'Dubrovnik',
      theme: 'car-vs-no-car',
      language: 'en',
    },
    {
      title: 'Best Time to Visit Hvar',
      description: 'Month-by-month guide: crowds, weather, prices, and what each season offers for different traveler types.',
      destination: 'hvar',
      destinationName: 'Hvar',
      theme: 'best-time-to-visit',
      language: 'en',
    },
  ];

  // AI Decision Quick Answers - citabilni snippets
  const quickAnswers = [
    {
      question: 'Is Croatia safe for solo female travelers?',
      answer: 'Yes. Croatia ranks among Europe\'s safest destinations with low crime rates. Main tourist areas are well-lit and walkable at night.',
      icon: Shield,
    },
    {
      question: 'Do I need a car to explore Croatia?',
      answer: 'For coastal cities (Split, Dubrovnik, Zadar): No. For islands and national parks: Recommended but not essential.',
      icon: Car,
    },
    {
      question: 'Best month to visit Croatian coast?',
      answer: 'September offers the ideal balance: warm seas (24°C), fewer crowds than August, and 20-30% lower prices.',
      icon: Clock,
    },
  ];

  const features = [
    {
      icon: HelpCircle,
      title: 'Decision-First Content',
      description: 'We answer the questions you actually ask: "Is it worth it?", "Do I need a car?", "Best for families?"',
      color: 'ocean',
    },
    {
      icon: CheckCircle,
      title: 'AI-Verified Facts',
      description: 'Every claim is fact-checked and citable. Perfect for AI assistants to quote directly.',
      color: 'seafoam',
    },
    {
      icon: Users,
      title: 'Traveler-Type Focused',
      description: 'Guides tailored for solo travelers, families, seniors, digital nomads, and more.',
      color: 'coral',
    },
    {
      icon: Award,
      title: 'No Booking Bias',
      description: 'Pure travel decisions. No affiliate pressure. Just honest, practical answers.',
      color: 'sand',
    },
  ];

  return (
    <>
      {/* Hero Section - AI Decision Authority */}
      <section className="relative overflow-hidden bg-gradient-to-br from-ocean-500 via-ocean-400 to-seafoam-400 text-white">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-mesh-ocean" />
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="ocean-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <circle cx="25" cy="25" r="2" fill="white" opacity="0.3" />
                <circle cx="75" cy="75" r="1.5" fill="white" opacity="0.2" />
                <circle cx="50" cy="90" r="1" fill="white" opacity="0.25" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#ocean-pattern)" />
          </svg>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-float" />
        <div className="absolute top-40 right-20 w-32 h-32 bg-seafoam-300/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-white/10 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }} />

        <div className="container relative py-16 md:py-24 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge - AI Authority Signal */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-md rounded-full mb-6 shadow-soft animate-slide-down">
              <CheckCircle className="w-4 h-4 text-seafoam-200" />
              <span className="text-sm font-semibold">AI-Optimized Travel Decisions</span>
            </div>

            {/* Headline - Decision Focus */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 leading-tight tracking-tight animate-fade-in">
              Know Where, When
              <span className="block mt-1 md:mt-2 text-transparent bg-clip-text bg-gradient-to-r from-white via-seafoam-100 to-white">
                & Why Before You Book
              </span>
            </h1>

            {/* Subheadline - Citabilni snippet */}
            <p className="text-lg sm:text-xl md:text-2xl text-ocean-50 mb-8 md:mb-10 leading-relaxed max-w-3xl mx-auto px-4 animate-slide-up">
              Croatia decision guides for real travelers. Is it worth it? Do you need a car? Best time to visit? We answer the questions that matter.
            </p>

            {/* CTA Buttons - Mobile First */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mb-10 md:mb-12 px-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <Link
                href="/guides"
                className="w-full sm:w-auto px-6 md:px-8 py-3.5 md:py-4 bg-white text-ocean-600 font-bold text-base md:text-lg rounded-2xl hover:bg-ocean-50 transition-all shadow-large hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
              >
                <HelpCircle className="w-5 h-5" />
                <span>Browse Decision Guides</span>
              </Link>
              <Link
                href="/destinations"
                className="w-full sm:w-auto px-6 md:px-8 py-3.5 md:py-4 bg-white/10 backdrop-blur-sm text-white font-bold text-base md:text-lg rounded-2xl hover:bg-white/20 transition-all border-2 border-white/30 hover:border-white/50 flex items-center justify-center gap-2"
              >
                <MapPin className="w-5 h-5" />
                <span>Explore Destinations</span>
              </Link>
            </div>

            {/* Quick Stats - Mobile Optimized */}
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-sm px-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <span className="font-semibold text-xs md:text-sm">60+ Destinations</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <HelpCircle className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <span className="font-semibold text-xs md:text-sm">500+ Decision Guides</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Users className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <span className="font-semibold text-xs md:text-sm">11 Languages</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Decoration */}
        <div className="absolute bottom-0 left-0 right-0 text-white">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path
              d="M0,64 C240,100 480,100 720,64 C960,28 1200,28 1440,64 L1440,120 L0,120 Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </section>

      {/* AI Quick Answers - Citabilni Snippets */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container">
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-ocean-100 text-ocean-700 rounded-full text-sm font-semibold mb-4">
              <Sparkles className="w-4 h-4" />
              <span>Quick Answers</span>
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
              Common Croatia Travel Questions
            </h2>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto px-4">
              Direct answers AI assistants can cite. No fluff, just facts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 px-4 md:px-0">
            {quickAnswers.map((qa, index) => {
              const Icon = qa.icon;
              return (
                <div
                  key={index}
                  className="group p-5 md:p-6 bg-gradient-to-br from-slate-50 to-white rounded-2xl border-2 border-slate-100 hover:border-ocean-200 hover:shadow-medium transition-all"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-ocean-400 to-ocean-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-slate-900 leading-snug">
                      {qa.question}
                    </h3>
                  </div>
                  {/* Citabilni snippet - quotable by AI */}
                  <blockquote className="pl-4 border-l-4 border-ocean-300 text-slate-700 text-sm md:text-base leading-relaxed italic">
                    "{qa.answer}"
                  </blockquote>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/guides"
              className="inline-flex items-center gap-2 text-ocean-600 hover:text-ocean-700 font-semibold transition-colors group"
            >
              See all decision guides
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us - AI Authority Features */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-slate-50 to-white">
        <div className="container">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
              Why BookiScout?
            </h2>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto px-4">
              Decision-first travel content designed for how you actually plan trips
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 px-4 md:px-0">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const colorClasses = {
                ocean: 'from-ocean-400 to-ocean-600',
                seafoam: 'from-seafoam-400 to-seafoam-600',
                coral: 'from-coral-400 to-coral-600',
                sand: 'from-sand-400 to-sand-600',
              };

              return (
                <div
                  key={index}
                  className="group p-5 md:p-6 bg-white rounded-2xl border border-slate-100 hover:border-ocean-200 hover:shadow-medium transition-all duration-300"
                >
                  <div className={`w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br ${colorClasses[feature.color as keyof typeof colorClasses]} rounded-2xl flex items-center justify-center mb-4 shadow-soft group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-12 md:py-16 lg:py-20 bg-gradient-ocean-subtle">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-ocean-100 text-ocean-700 rounded-full text-sm font-semibold mb-3 md:mb-4">
                <MapPin className="w-4 h-4" />
                <span>Explore by Location</span>
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-2 md:mb-3">
                Top Destinations
              </h2>
              <p className="text-base md:text-lg text-slate-600">
                Decision guides for Croatia's most visited places
              </p>
            </div>
            <Link
              href="/destinations"
              className="hidden md:flex items-center gap-2 text-ocean-600 hover:text-ocean-700 font-semibold transition-colors group"
            >
              View all destinations
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            {popularDestinations.map((destination) => (
              <DestinationCard
                key={destination.slug}
                destination={destination}
                articleCount={20}
              />
            ))}
          </div>

          <Link
            href="/destinations"
            className="md:hidden flex items-center justify-center gap-2 text-ocean-600 hover:text-ocean-700 font-semibold transition-colors"
          >
            View all destinations
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Featured Decision Guides */}
      <section className="py-12 md:py-16 lg:py-20 bg-white">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-coral-100 text-coral-700 rounded-full text-sm font-semibold mb-3 md:mb-4">
                <HelpCircle className="w-4 h-4" />
                <span>Decision Guides</span>
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-2 md:mb-3">
                Popular Questions Answered
              </h2>
              <p className="text-base md:text-lg text-slate-600">
                Practical answers to help you decide where, when, and how to visit
              </p>
            </div>
            <Link
              href="/guides"
              className="hidden md:flex items-center gap-2 text-ocean-600 hover:text-ocean-700 font-semibold transition-colors group"
            >
              View all guides
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {featuredArticles.map((article, index) => (
              <ArticleCard key={index} {...article} />
            ))}
          </div>

          <Link
            href="/guides"
            className="md:hidden flex items-center justify-center gap-2 mt-6 text-ocean-600 hover:text-ocean-700 font-semibold transition-colors"
          >
            View all decision guides
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Newsletter CTA - Mobile Optimized */}
      <section className="py-16 md:py-20 lg:py-24 bg-gradient-to-br from-ocean-500 via-ocean-600 to-seafoam-600 relative overflow-hidden">
        {/* Background decoration - hidden on mobile */}
        <div className="hidden md:block absolute inset-0 opacity-10">
          <Waves className="absolute top-10 right-10 w-64 h-64" />
          <Waves className="absolute bottom-10 left-10 w-48 h-48" />
        </div>
        <div className="hidden md:block absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl opacity-10" />
        <div className="hidden md:block absolute bottom-0 left-0 w-96 h-96 bg-seafoam-300 rounded-full blur-3xl opacity-10" />

        <div className="container relative px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-full mb-4 md:mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-semibold">Stay Informed</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-5">
              Get New Decision Guides
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-ocean-50 mb-8 md:mb-10 leading-relaxed px-2">
              Weekly updates on Croatia travel decisions. No spam, just useful answers to common questions.
            </p>

            <form className="flex flex-col sm:flex-row gap-3 md:gap-4 max-w-xl mx-auto mb-5 md:mb-6">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 px-5 md:px-6 py-3.5 md:py-4 rounded-2xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-white/30 shadow-soft text-base md:text-lg"
              />
              <button
                type="submit"
                className="px-6 md:px-8 py-3.5 md:py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-soft hover:shadow-medium hover:scale-105"
              >
                Subscribe
              </button>
            </form>

            <p className="text-xs md:text-sm text-ocean-100 flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Join 10,000+ travelers. Unsubscribe anytime.</span>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
