import { Metadata } from 'next';
import { ChevronRight, Shield } from 'lucide-react';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Privacy Policy - BookiScout',
    description: 'BookiScout privacy policy. Learn how we collect, use, and protect your personal information.',
  };
}

export default async function PrivacyPage({ params }: Props) {
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
          <nav className="flex items-center gap-2 text-sm text-ocean-100 mb-8">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white font-semibold">Privacy Policy</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full mb-6">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-semibold">Your Privacy Matters</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Privacy Policy
            </h1>
            <p className="text-ocean-100">
              Last updated: {lastUpdated}
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="max-w-3xl mx-auto prose prose-slate prose-lg">

            <h2>Introduction</h2>
            <p>
              BookiScout (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website bookiscout.com.
            </p>

            <h2>Information We Collect</h2>

            <h3>Information You Provide</h3>
            <p>We may collect information you voluntarily provide, such as:</p>
            <ul>
              <li>Email address (if you subscribe to our newsletter or contact us)</li>
              <li>Any other information you choose to provide in communications with us</li>
            </ul>

            <h3>Automatically Collected Information</h3>
            <p>When you visit our website, we may automatically collect:</p>
            <ul>
              <li>Browser type and version</li>
              <li>Operating system</li>
              <li>Pages visited and time spent on pages</li>
              <li>Referring website addresses</li>
              <li>IP address (anonymized)</li>
              <li>Device information</li>
            </ul>

            <h2>How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide and improve our travel guides and services</li>
              <li>Respond to your inquiries and requests</li>
              <li>Send newsletters (only if you&apos;ve subscribed)</li>
              <li>Analyze website usage to improve user experience</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2>Cookies</h2>
            <p>
              We use essential cookies to ensure basic website functionality. We may also use analytics cookies to understand how visitors interact with our website. You can control cookie preferences through your browser settings.
            </p>

            <h2>Third-Party Services</h2>
            <p>We may use third-party services that collect information, including:</p>
            <ul>
              <li><strong>Analytics providers</strong> - to understand website usage</li>
              <li><strong>Hosting providers</strong> - to serve our website</li>
            </ul>
            <p>These third parties have their own privacy policies governing their use of information.</p>

            <h2>Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>

            <h2>Your Rights (GDPR)</h2>
            <p>If you are in the European Economic Area, you have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Correct inaccurate personal data</li>
              <li>Request deletion of your personal data</li>
              <li>Object to processing of your personal data</li>
              <li>Request restriction of processing</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>

            <h2>Data Retention</h2>
            <p>
              We retain personal information only for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required by law.
            </p>

            <h2>Children&apos;s Privacy</h2>
            <p>
              Our website is not intended for children under 16 years of age. We do not knowingly collect personal information from children under 16.
            </p>

            <h2>Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
            </p>

            <h2>Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or wish to exercise your rights, please contact us at:
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
