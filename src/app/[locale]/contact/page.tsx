import { Metadata } from 'next';
import { ChevronRight, Mail, MessageSquare, Clock, MapPin } from 'lucide-react';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Contact Us - BookiScout',
    description: 'Get in touch with BookiScout. Questions about Croatia travel? Feedback about our guides? We\'d love to hear from you.',
  };
}

export default async function ContactPage({ params }: Props) {
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
          <nav className="flex items-center gap-2 text-xs sm:text-sm text-ocean-100 mb-6 md:mb-8">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white font-semibold">Contact</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/15 backdrop-blur-sm rounded-full mb-4 md:mb-6">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm font-semibold">Get in Touch</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight">
              Contact Us
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-ocean-50 leading-relaxed">
              Have questions about Croatia travel or feedback about our guides? We&apos;d love to hear from you.
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 text-white">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-6 sm:h-auto" preserveAspectRatio="none">
            <path d="M0,48 C240,64 480,64 720,48 C960,32 1200,32 1440,48 L1440,80 L0,80 Z" fill="currentColor" />
          </svg>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12">

              {/* Main Contact */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">Send Us a Message</h2>
                <p className="text-sm sm:text-base text-slate-600 mb-6 sm:mb-8">
                  The best way to reach us is via email. We try to respond to all inquiries within 48 hours.
                </p>

                <a
                  href="mailto:bookiscout@gmail.com"
                  className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6 bg-gradient-to-br from-ocean-50 to-seafoam-50 rounded-xl sm:rounded-2xl border-2 border-ocean-100 hover:border-ocean-300 transition-colors group"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-ocean-400 to-ocean-600 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                    <Mail className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-slate-500 font-medium">Email us at</p>
                    <p className="text-base sm:text-xl font-bold text-ocean-600 truncate">bookiscout@gmail.com</p>
                  </div>
                </a>
              </div>

              {/* Additional Info */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">What We Can Help With</h2>

                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 rounded-lg sm:rounded-xl">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-seafoam-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-seafoam-600" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-slate-900">Travel Questions</h3>
                      <p className="text-xs sm:text-sm text-slate-600">Questions about Croatia destinations, best times to visit, or travel planning</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 rounded-lg sm:rounded-xl">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-ocean-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-ocean-600" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-slate-900">Feedback & Suggestions</h3>
                      <p className="text-xs sm:text-sm text-slate-600">Ideas for improving our guides or new content you&apos;d like to see</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 rounded-lg sm:rounded-xl">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-coral-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-coral-600" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-slate-900">Content Corrections</h3>
                      <p className="text-xs sm:text-sm text-slate-600">Spotted an error or outdated information? Let us know</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Response Time */}
            <div className="mt-10 sm:mt-12 md:mt-16 p-5 sm:p-6 md:p-8 bg-gradient-to-br from-slate-50 to-white rounded-2xl md:rounded-3xl border border-slate-100">
              <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6 text-center md:text-left">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-sand-400 to-coral-500 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1 sm:mb-2">Response Time</h3>
                  <p className="text-sm sm:text-base text-slate-600">
                    We typically respond within 24-48 hours. For urgent travel questions, please note that we&apos;re a small team and may not be able to provide immediate assistance.
                  </p>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="mt-4 sm:mt-6 md:mt-8 p-5 sm:p-6 md:p-8 bg-gradient-to-br from-slate-50 to-white rounded-2xl md:rounded-3xl border border-slate-100">
              <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6 text-center md:text-left">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-ocean-400 to-seafoam-500 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1 sm:mb-2">Based in Croatia</h3>
                  <p className="text-sm sm:text-base text-slate-600">
                    BookiScout is proudly based in Croatia, giving us firsthand knowledge of the destinations we write about.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
