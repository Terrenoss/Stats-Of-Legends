"use client";

import React, { useState } from 'react';
import { Github, Twitter, Disc, Info } from "lucide-react";
import { SafeLink } from "./ui/SafeLink";
import { useI18n } from "../app/LanguageContext";

export const Footer = () => {
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const { t } = useI18n();

  const handlePlaceholderClick = (e: React.MouseEvent, label: string) => {
    e.preventDefault();
    setToastMsg(`${label} ${t.placeholderToast}`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <footer className="bg-[#080808] border-t border-white/5 pt-16 pb-8 mt-auto relative">
      {/* Toast Notification */}
      {toastMsg && (
         <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#1a1a1a] border border-lol-gold text-white px-6 py-3 rounded-full shadow-[0_0_20px_rgba(200,170,110,0.2)] z-50 font-bold text-xs animate-fadeIn flex items-center gap-3">
            <Info className="w-4 h-4 text-lol-gold" />
            {toastMsg}
         </div>
       )}

      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
             <h3 className="font-display font-bold text-white text-xl tracking-wider mb-4 uppercase">{t.footerTitle}</h3>
             <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
               {t.footerTagline}
             </p>
             <div className="flex gap-4 mt-6">
                <SocialIcon icon={<Twitter size={18} />} onClick={(e) => handlePlaceholderClick(e, 'Twitter')} />
                <SocialIcon icon={<Github size={18} />} onClick={(e) => handlePlaceholderClick(e, 'GitHub')} />
                <SocialIcon icon={<Disc size={18} />} onClick={(e) => handlePlaceholderClick(e, 'Discord')} />
             </div>
          </div>
          
          <div>
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-6">Navigation</h4>
            <ul className="space-y-3 text-sm text-gray-500">
              <li><SafeLink href="/" className="hover:text-lol-gold transition-colors">{t.navHome}</SafeLink></li>
              <li><SafeLink href="/builder" className="hover:text-lol-gold transition-colors">{t.navBuilder}</SafeLink></li>
              <li><SafeLink href="/leaderboard" className="hover:text-lol-gold transition-colors">{t.navLeaderboard}</SafeLink></li>
              <li>
                <button onClick={(e) => handlePlaceholderClick(e, 'API Status')} className="hover:text-lol-gold transition-colors text-left">
                  {t.apiStatus}
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-6">{t.resources}</h4>
            <ul className="space-y-3 text-sm text-gray-500">
              <li><a href="https://developer.riotgames.com/" target="_blank" rel="noreferrer" className="hover:text-lol-gold transition-colors">{t.riotApi}</a></li>
              <li>
                <button onClick={(e) => handlePlaceholderClick(e, 'Privacy Policy')} className="hover:text-lol-gold transition-colors text-left">
                  {t.privacyPolicy}
                </button>
              </li>
              <li>
                <button onClick={(e) => handlePlaceholderClick(e, 'Terms of Service')} className="hover:text-lol-gold transition-colors text-left">
                  {t.termsOfService}
                </button>
              </li>
              <li>
                <button onClick={(e) => handlePlaceholderClick(e, 'Contact Support')} className="hover:text-lol-gold transition-colors text-left">
                  {t.contactSupport}
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-700 font-mono">
            {t.footerCopyright}
          </p>
          <p className="text-[10px] text-gray-700 max-w-2xl text-center md:text-right leading-relaxed">
            {t.footerDisclaimer}
          </p>
        </div>
      </div>
    </footer>
  );
};

const SocialIcon = ({ icon, onClick }: { icon: React.ReactNode, onClick: (e: React.MouseEvent) => void }) => (
  <button 
    onClick={onClick}
    className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
  >
    {icon}
  </button>
);