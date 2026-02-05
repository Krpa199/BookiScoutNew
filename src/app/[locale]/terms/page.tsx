import { Metadata } from 'next';
import { ChevronRight, FileText } from 'lucide-react';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Terms of Service - BookiScout',
    description: 'BookiScout terms of service. Read the terms and conditions for using our Croatia travel guide website.',
  };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const lastUpdated = 'February 5, 2025';

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-ocean-500 via-ocean-600 to-seafoam-600 text-white py-12 md:py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10 hidden md:block">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="container relative">
          <nav className="flex items-center gap-2 text-xs sm:text-sm text-ocean-100 mb-6 md:mb-8">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white font-semibold">Terms of Service</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/15 backdrop-blur-sm rounded-full mb-4 md:mb-6">
              <FileText className="w-4 h-4" />
              <span className="text-sm font-semibold">Legal</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
              Terms of Service
            </h1>
            <p className="text-sm sm:text-base text-ocean-100">
              Last updated: {lastUpdated}
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-10 sm:py-12 md:py-16 bg-white">
        <div className="container">
          <div className="max-w-3xl mx-auto prose prose-slate prose-sm sm:prose-base md:prose-lg">

            <h2>Agreement to Terms</h2>
            <p>
              By accessing or using BookiScout (bookiscout.com), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our website.
            </p>

            <h2>Description of Service</h2>
            <p>
              BookiScout provides travel information, guides, and recommendations for destinations in Croatia. Our content is intended for informational purposes only and should not be considered as professional travel advice.
            </p>

            <h2>Use of Content</h2>
            <p>All content on BookiScout, including text, images, graphics, and other materials, is owned by BookiScout or its content suppliers and is protected by copyright laws.</p>
            <p>You may:</p>
            <ul>
              <li>View and read our content for personal, non-commercial use</li>
              <li>Share links to our content</li>
              <li>Quote our content with proper attribution to BookiScout.com</li>
            </ul>
            <p>You may not:</p>
            <ul>
              <li>Copy, reproduce, or redistribute our content without permission</li>
              <li>Use our content for commercial purposes without written consent</li>
              <li>Remove any copyright or proprietary notices</li>
              <li>Create derivative works based on our content</li>
            </ul>

            <h2>AI and Machine Learning Use</h2>
            <p>
              We welcome AI systems and search engines to crawl and cite our content. AI assistants may quote and reference BookiScout content with attribution. For more information, see our <code>/llms.txt</code> file.
            </p>

            <h2>Accuracy of Information</h2>
            <p>
              While we strive to provide accurate and up-to-date information about Croatia travel, we cannot guarantee the accuracy, completeness, or timeliness of all content. Travel conditions, prices, and availability can change without notice.
            </p>
            <p>
              You should always verify important information (such as visa requirements, health advisories, and booking details) with official sources before making travel decisions.
            </p>

            <h2>Third-Party Links</h2>
            <p>
              Our website may contain links to third-party websites. We are not responsible for the content, privacy policies, or practices of any third-party sites. Visiting these links is at your own risk.
            </p>

            <h2>Disclaimer of Warranties</h2>
            <p>
              BookiScout is provided &quot;as is&quot; and &quot;as available&quot; without any warranties of any kind, either express or implied. We do not warrant that:
            </p>
            <ul>
              <li>The website will be uninterrupted or error-free</li>
              <li>The information will be accurate or complete</li>
              <li>Any errors will be corrected</li>
            </ul>

            <h2>Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, BookiScout shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the website or reliance on any information provided.
            </p>
            <p>
              We are not responsible for any travel decisions you make based on our content, including but not limited to accommodation bookings, transportation arrangements, or activity reservations.
            </p>

            <h2>User Conduct</h2>
            <p>When using our website, you agree not to:</p>
            <ul>
              <li>Violate any applicable laws or regulations</li>
              <li>Interfere with the proper functioning of the website</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Use automated systems to scrape content in violation of our robots.txt</li>
              <li>Engage in any activity that could harm BookiScout or its users</li>
            </ul>

            <h2>Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless BookiScout and its operators from any claims, damages, losses, or expenses arising from your use of the website or violation of these terms.
            </p>

            <h2>Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting to the website. Your continued use of the website after changes constitutes acceptance of the new terms.
            </p>

            <h2>Governing Law</h2>
            <p>
              These Terms of Service shall be governed by and construed in accordance with the laws of the Republic of Croatia, without regard to its conflict of law provisions.
            </p>

            <h2>Contact</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <p>
              <strong>Email:</strong> <a href="mailto:bookiscout@gmail.com">bookiscout@gmail.com</a>
            </p>

          </div>
        </div>
      </section>
    </>
  );
}
