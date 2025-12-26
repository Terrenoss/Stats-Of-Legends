import React from 'react';
import { Trophy } from 'lucide-react';

interface LeaderboardViewProps {
    t: any;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ t }) => {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
            <div className="w-20 h-20 bg-lol-dark border border-lol-gold rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                <Trophy className="w-10 h-10 text-lol-gold" />
            </div>
            <h2 className="text-3xl font-display font-bold text-white mb-2">Classement Challenger</h2>
            <p className="text-gray-400 max-w-md">
                {t.maintenance}
            </p>
        </div>
    );
};
