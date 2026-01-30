import Link from 'next/link';
import { Search, MapPin, Sparkles, TrendingUp, Star, ArrowRight, Waves, Sun, Compass, Award, Users, Shield } from 'lucide-react';
import DestinationCard from '@/components/ui/DestinationCard';
import ArticleCard from '@/components/ui/ArticleCard';
import { DESTINATIONS } from '@/config/destinations';

export default function HomePage() {
  const popularDestinations = DESTINATIONS.filter(d => d.popular).slice(0, 6);

  // Sample featured articles (will be dynamic later)
  const featuredArticles = [
    {
      title: 'Best Family Apartments in Split 2026',
      description: 'Discover the top family-friendly apartments near beaches with pools and kid-friendly amenities.',
      destination: 'split',
      destinationName: 'Split',
      theme: 'family',
      language: 'en',
    },
    {
      title: 'Hidden Beaches of Hvar Island',
      description: 'Escape the crowds and find secret coves and pristine beaches on Croatia\'s most famous island.',
      destination: 'hvar',
      destinationName: 'Hvar',
      theme: 'beach',
      language: 'en',
    },
    {
      title: 'Budget Travel Guide to Dubrovnik',
      description: 'How to experience the Pearl of the Adriatic without breaking the bank. Tips and tricks inside.',
      destination: 'dubrovnik',
      destinationName: 'Dubrovnik',
      theme: 'budget',
      language: 'en',
    },
  ];

  const features = [
    {
      icon: Sparkles,
      title: 'AI-Powered Insights',
      description: 'Smart recommendations tailored to your preferences and travel style.',
      color: 'ocean',
    },
    {
      icon: Award,
      title: 'Expert Curated',
      description: 'Handpicked destinations and verified local tips from travel experts.',
      color: 'seafoam',
    },
    {
      icon: Users,
      title: '11 Languages',
      description: 'Comprehensive guides available in multiple languages for global travelers.',
      color: 'coral',
    },
    {
      icon: Shield,
      title: 'Always Updated',
      description: 'Fresh content and real-time information you can trust for planning.',
      color: 'sand',
    },
  ];

  return (
    <>
      {/* Hero Section - Ocean Themed */}
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

        <div className="container relative py-24 md:py-32 lg:py-40">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 backdrop-blur-md rounded-full mb-8 shadow-soft animate-slide-down">
              <Sparkles className="w-4 h-4 text-sand-200" />
              <span className="text-sm font-semibold">Your Ultimate Croatia Travel Guide</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight animate-fade-in">
              Discover Croatia's
              <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-white via-seafoam-100 to-white">
                Hidden Paradise
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-ocean-50 mb-10 leading-relaxed max-w-3xl mx-auto animate-slide-up">
              Explore destinations, beaches, and neighborhoods that match your travel style. Make informed decisions with AI-powered insights.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <Link
                href="/destinations"
                className="w-full sm:w-auto px-8 py-4 bg-white text-ocean-600 font-bold text-lg rounded-2xl hover:bg-ocean-50 transition-all shadow-large hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
              >
                <Search className="w-5 h-5" />
                <span>Explore Destinations</span>
              </Link>
              <Link
                href="/guides"
                className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-bold text-lg rounded-2xl hover:bg-white/20 transition-all border-2 border-white/30 hover:border-white/50 flex items-center justify-center gap-2"
              >
                <Compass className="w-5 h-5" />
                <span>Browse Guides</span>
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="font-semibold">60+ Destinations</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Star className="w-5 h-5" />
                </div>
                <span className="font-semibold">500+ Guides</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="font-semibold">11 Languages</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Decoration - More organic */}
        <div className="absolute bottom-0 left-0 right-0 text-white">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path
              d="M0,64 C240,100 480,100 720,64 C960,28 1200,28 1440,64 L1440,120 L0,120 Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </section>

      {/* Why Choose Us - Features */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Why BookiScout?</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              AI-powered travel guides that help you discover Croatia like a local
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  className="group p-6 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-100 hover:border-ocean-200 hover:shadow-medium transition-all duration-300 hover:scale-105"
                >
                  <div className={`w-14 h-14 bg-gradient-to-br ${colorClasses[feature.color as keyof typeof colorClasses]} rounded-2xl flex items-center justify-center mb-4 shadow-soft group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-20 bg-gradient-ocean-subtle">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-ocean-100 text-ocean-700 rounded-full text-sm font-semibold mb-4">
                <Sun className="w-4 h-4" />
                <span>Most Popular</span>
              </div>
              <h2 className="text-4xl font-bold text-slate-900 mb-3">Top Destinations</h2>
              <p className="text-xl text-slate-600">Explore Croatia's most loved places</p>
            </div>
            <Link
              href="/destinations"
              className="hidden md:flex items-center gap-2 text-ocean-600 hover:text-ocean-700 font-semibold transition-colors group"
            >
              View all destinations
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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

      {/* Featured Guides */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-coral-100 text-coral-700 rounded-full text-sm font-semibold mb-4">
                <Sparkles className="w-4 h-4" />
                <span>Expert Guides</span>
              </div>
              <h2 className="text-4xl font-bold text-slate-900 mb-3">Travel Guides</h2>
              <p className="text-xl text-slate-600">AI-powered tips for your perfect Croatian vacation</p>
            </div>
            <Link
              href="/guides"
              className="hidden md:flex items-center gap-2 text-ocean-600 hover:text-ocean-700 font-semibold transition-colors group"
            >
              View all guides
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredArticles.map((article, index) => (
              <ArticleCard key={index} {...article} />
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA - Ocean Themed */}
      <section className="py-24 bg-gradient-to-br from-ocean-500 via-ocean-600 to-seafoam-600 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <Waves className="absolute top-10 right-10 w-64 h-64" />
          <Waves className="absolute bottom-10 left-10 w-48 h-48" />
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl opacity-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-seafoam-300 rounded-full blur-3xl opacity-10" />

        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-semibold">Join Our Community</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-5">
              Get Insider Travel Tips
            </h2>
            <p className="text-xl text-ocean-50 mb-10 leading-relaxed">
              Subscribe for exclusive deals, hidden gems, and local secrets you won't find anywhere else.
            </p>

            <form className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto mb-6">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-6 py-4 rounded-2xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-white/30 shadow-soft text-lg"
              />
              <button
                type="submit"
                className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-soft hover:shadow-medium hover:scale-105"
              >
                Subscribe
              </button>
            </form>

            <p className="text-sm text-ocean-100 flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Join 10,000+ travelers. Unsubscribe anytime.</span>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
