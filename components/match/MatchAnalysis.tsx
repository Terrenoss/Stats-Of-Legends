
import React from 'react';
import { Sparkles, Brain, Zap, Loader2 } from 'lucide-react';
import { TRANSLATIONS } from '../../constants';

interface MatchAnalysisProps {
   analysis: string | null;
   loading: boolean;
   lang: string;
}

export const MatchAnalysis: React.FC<MatchAnalysisProps> = ({ analysis, loading, lang }) => {
   const t = TRANSLATIONS[lang as keyof typeof TRANSLATIONS];

   return (
      <div className="mb-6 animate-fadeIn">
         {loading ? (
            <div className="bg-[#18181b] p-8 rounded-xl border border-lol-hextech/20 relative overflow-hidden group shadow-[0_0_15px_rgba(147,51,234,0.1)]">
               <div className="absolute inset-0 bg-gradient-to-r from-lol-hextech/5 via-transparent to-lol-hextech/5 animate-pulse"></div>

               <div className="flex flex-col items-center justify-center gap-4 relative z-10">
                  <div className="relative">
                     <div className="w-16 h-16 rounded-full bg-lol-hextech/10 flex items-center justify-center border border-lol-hextech/30 relative z-10">
                        <Brain className="w-8 h-8 text-lol-hextech animate-pulse" />
                     </div>
                     <div className="absolute -inset-2 bg-lol-hextech rounded-full blur-xl opacity-20 animate-ping"></div>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                     <span className="text-lol-hextech font-bold text-base flex items-center gap-2 uppercase tracking-wider">
                        <Zap className="w-4 h-4 fill-current" />
                        AI Coach Thinking
                     </span>
                     <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Gemini 3.0 Pro is analyzing replay data...</span>
                     </div>
                     <span className="text-[10px] text-gray-600 font-mono mt-1">Budget: 32k tokens</span>
                  </div>
               </div>
            </div>
         ) : (
            <div className="bg-[#18181b] p-6 rounded-xl border border-lol-hextech/30 text-sm text-gray-300 font-light leading-relaxed relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 right-0 w-48 h-48 bg-lol-hextech/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
               <h4 className="text-lol-hextech font-bold uppercase tracking-wider text-xs mb-4 flex items-center gap-2 relative z-10 border-b border-lol-hextech/10 pb-2">
                  <Sparkles className="w-4 h-4" /> Coach Analysis
               </h4>
               <div className="relative z-10 prose prose-invert max-w-none prose-p:text-gray-300 prose-strong:text-white prose-li:text-gray-300">
                  {(analysis || '').split('\n').map((line, i) => (
                     <p key={i} className="mb-2">{line}</p>
                  ))}
               </div>
            </div>
         )}
      </div>
   );
};
