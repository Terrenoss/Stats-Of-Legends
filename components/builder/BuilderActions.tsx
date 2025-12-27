import React from 'react';
import { Undo, Redo, RotateCcw, Brain, Loader2 } from 'lucide-react';

interface BuilderActionsProps {
    history: { undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean; reset: () => void };
    onAnalyze: () => void;
    isAnalyzing: boolean;
    aiAnalysis: string | null;
    t: Record<string, string>;
}

export const BuilderActions: React.FC<BuilderActionsProps> = ({ history, onAnalyze, isAnalyzing, aiAnalysis, t }) => {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex gap-4">
                <div className="flex gap-2">
                    <button
                        onClick={history.undo}
                        disabled={!history.canUndo}
                        className="w-12 h-12 flex items-center justify-center rounded-2xl border border-white/10 text-gray-400 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition bg-[#121212]"
                        title={t.undo}
                    >
                        <Undo className="w-5 h-5" />
                    </button>
                    <button
                        onClick={history.redo}
                        disabled={!history.canRedo}
                        className="w-12 h-12 flex items-center justify-center rounded-2xl border border-white/10 text-gray-400 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition bg-[#121212]"
                        title={t.redo}
                    >
                        <Redo className="w-5 h-5" />
                    </button>
                </div>

                <button
                    onClick={() => history.reset()}
                    className="px-6 py-4 rounded-2xl border border-lol-red/50 text-lol-red hover:bg-lol-red/10 transition uppercase tracking-wider font-bold text-sm flex justify-center items-center gap-2 group flex-1"
                >
                    <RotateCcw className="w-4 h-4 group-hover:-rotate-180 transition-transform duration-500" /> {t.reset}
                </button>
                <button
                    onClick={onAnalyze}
                    disabled={isAnalyzing}
                    className="flex-[2] px-6 py-4 rounded-2xl bg-lol-gold hover:bg-[#D4AF37] text-black font-bold shadow-lg shadow-lol-gold/10 transition uppercase tracking-wider flex justify-center items-center gap-2 disabled:opacity-50 relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <Brain className="w-4 h-4 relative z-10" /> <span className="relative z-10">{isAnalyzing ? t.loading : t.analyzeBuild}</span>
                </button>
            </div>

            {/* Thinking State */}
            {isAnalyzing && (
                <div className="bg-[#121212] border border-lol-gold/20 p-6 rounded-[2rem] shadow-xl animate-fadeIn flex items-center gap-5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-lol-gold/5 via-transparent to-lol-gold/5 animate-pulse"></div>
                    <div className="w-12 h-12 rounded-full bg-lol-gold/10 flex items-center justify-center border border-lol-gold/30 relative z-10">
                        <Brain className="w-6 h-6 text-lol-gold animate-pulse" />
                    </div>
                    <div className="relative z-10">
                        <div className="text-lol-gold font-bold text-sm flex items-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            {t.thinking}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <span>{t.analyzingDesc}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Gemini Result */}
            {aiAnalysis && !isAnalyzing && (
                <div className="bg-[#121212] border border-lol-hextech/30 p-8 rounded-[2rem] shadow-2xl animate-fadeIn relative overflow-hidden">
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-lol-hextech/10 rounded-full blur-[100px]"></div>
                    <h3 className="text-lol-hextech font-bold mb-4 flex items-center gap-3 font-display text-xl tracking-wide">
                        <div className="p-2 bg-lol-hextech/20 rounded-xl"><Brain className="w-6 h-6" /></div> Analyse du Coach
                    </h3>
                    <div className="prose prose-invert prose-sm text-gray-300 font-light leading-relaxed">
                        {aiAnalysis.split('\n').map((line, i) => (
                            <p key={i} className="mb-2">{line}</p>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
