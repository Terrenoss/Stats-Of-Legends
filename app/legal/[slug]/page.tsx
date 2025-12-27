

import { Shield, FileText, Activity, Mail, ArrowLeft } from 'lucide-react';
import { SafeLink } from '@/components/ui/SafeLink';

// Map slugs to content
const LEGAL_CONTENT: Record<string, { title: string; icon: React.ReactNode; content: React.ReactNode }> = {
  'api-status': {
    title: "API Status",
    icon: <Activity className="w-12 h-12 text-lol-gold" />,
    content: (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl border border-white/5">
          <span className="font-bold text-white">Riot API Proxy</span>
          <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/30">OPERATIONAL</span>
        </div>
        <div className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl border border-white/5">
          <span className="font-bold text-white">Gemini AI Engine</span>
          <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/30">OPERATIONAL</span>
        </div>
        <div className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl border border-white/5">
          <span className="font-bold text-white">DataDragon CDN</span>
          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full border border-yellow-500/30">DEGRADED</span>
        </div>
      </div>
    )
  },
  'privacy-policy': {
    title: "Privacy Policy",
    icon: <Shield className="w-12 h-12 text-lol-gold" />,
    content: (
      <div className="space-y-4 text-sm text-gray-400 leading-relaxed">
        <p><strong>Last Updated: February {new Date().getFullYear()}</strong></p>
        <p>At Stats Of Legends, we take your privacy seriously. This policy describes how we treat your data.</p>
        <h3 className="text-white font-bold mt-4">1. Data Collection</h3>
        <p>We do not store personal data permanently. Summoner profiles are fetched in real-time from Riot Games APIs and cached temporarily for performance.</p>
        <h3 className="text-white font-bold mt-4">2. Cookies</h3>
        <p>We use local storage to save your recent searches and preferences (like language or region). No tracking cookies are used.</p>
      </div>
    )
  },
  'terms-of-service': {
    title: "Terms of Service",
    icon: <FileText className="w-12 h-12 text-lol-gold" />,
    content: (
      <div className="space-y-4 text-sm text-gray-400 leading-relaxed">
        <p>By using Stats Of Legends, you agree to the following terms:</p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>You will not use this tool for any illegal activities or to harass other players.</li>
          <li>You understand that this site is not endorsed by Riot Games.</li>
          <li>We are not responsible for any API outages or incorrect data.</li>
        </ul>
      </div>
    )
  },
  'contact-support': {
    title: "Contact Support",
    icon: <Mail className="w-12 h-12 text-lol-gold" />,
    content: (
      <div className="space-y-4 text-center">
        <p className="text-gray-400">Need help? Reach out to our developer team.</p>
        <a href="mailto:support@statsoflegends.gg" className="inline-block px-8 py-3 bg-lol-gold text-black font-bold rounded-full hover:bg-white transition-colors">
          support@statsoflegends.gg
        </a>
      </div>
    )
  }
};

export default async function LegalPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const slug = params.slug;
  const legalContent = LEGAL_CONTENT[slug];

  if (!legalContent) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-4xl font-display font-bold text-white mb-4">404</h1>
        <p className="text-gray-500">Document not found.</p>
        <SafeLink href="/" className="mt-6 text-lol-gold hover:underline">Return Home</SafeLink>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-20 animate-fadeIn">
      <SafeLink href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </SafeLink>

      <div className="bg-[#121212] border border-white/5 rounded-[2rem] p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-lol-gold/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        <div className="flex flex-col items-center text-center mb-10 relative z-10">
          <div className="w-20 h-20 bg-[#080808] border border-lol-gold/30 rounded-full flex items-center justify-center mb-6 shadow-glow-gold">
            {legalContent.icon}
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white uppercase tracking-wide">{legalContent.title}</h1>
        </div>

        <div className="relative z-10">
          {legalContent.content}
        </div>
      </div>
    </div>
  );
}
