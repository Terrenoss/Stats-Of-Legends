import React from 'react';

interface ChampionSkillPathProps {
    skillOrders: any[];
    topSkillPath: string[];
}

export const ChampionSkillPath: React.FC<ChampionSkillPathProps> = ({ skillOrders, topSkillPath }) => {
    return (
        <div className="bg-[#121212] border border-white/5 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Priority */}
                <div className="w-full md:w-auto md:min-w-[250px] flex-shrink-0">
                    <h3 className="text-lg font-bold text-white mb-4 border-l-4 border-lol-blue pl-3">Skill Priority</h3>
                    {skillOrders && skillOrders.length > 0 ? (
                        <div className="flex items-center gap-4">
                            {/* Infer priority from most common path */}
                            {(() => {
                                const path = skillOrders[0].path.split('-');
                                const counts = { Q: 0, W: 0, E: 0 };
                                path.slice(0, 9).forEach((k: string) => { if (['Q', 'W', 'E'].includes(k)) counts[k as keyof typeof counts]++ });
                                const priority = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(e => e[0]);

                                return (
                                    <div className="flex items-center gap-2 text-2xl font-bold">
                                        <span className="w-10 h-10 bg-lol-blue/20 rounded flex items-center justify-center border border-lol-blue text-lol-blue">{priority[0]}</span>
                                        <span className="text-gray-500">→</span>
                                        <span className="w-10 h-10 bg-[#222] rounded flex items-center justify-center border border-white/10">{priority[1]}</span>
                                        <span className="text-gray-500">→</span>
                                        <span className="w-10 h-10 bg-[#222] rounded flex items-center justify-center border border-white/10">{priority[2]}</span>
                                    </div>
                                );
                            })()}
                            <div className="text-sm text-gray-400 ml-4">
                                <div className="text-green-400 font-bold">{skillOrders[0].winRate.toFixed(2)}% WR</div>
                                <div>{skillOrders[0].matches} Matches</div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-500">No skill data.</div>
                    )}
                </div>

                {/* Path Grid */}
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-4 border-l-4 border-lol-blue pl-3">Skill Path</h3>
                    {topSkillPath && topSkillPath.length > 0 ? (
                        <div className="w-full">
                            {/* Header Row (Levels) */}
                            <div className="flex mb-2 ml-8">
                                {Array.from({ length: 18 }).map((_, i) => (
                                    <div key={i} className="flex-1 text-center text-[10px] text-gray-500 font-mono">{i + 1}</div>
                                ))}
                            </div>
                            {/* Rows for Q, W, E, R */}
                            {['Q', 'W', 'E', 'R'].map((skill) => (
                                <div key={skill} className="flex items-center mb-1 w-full">
                                    <div className="w-8 font-bold text-gray-400 text-sm flex-shrink-0">{skill}</div>
                                    <div className="flex flex-1">
                                        {Array.from({ length: 18 }).map((_, i) => {
                                            const active = topSkillPath[i] === skill;
                                            return (
                                                <div key={i} className="flex-1 h-8 flex items-center justify-center border border-white/5 bg-[#1a1a1a]">
                                                    {active && (
                                                        <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold shadow-lg ${skill === 'Q' ? 'bg-blue-600 text-white' :
                                                            skill === 'W' ? 'bg-green-600 text-white' :
                                                                skill === 'E' ? 'bg-purple-600 text-white' :
                                                                    'bg-red-600 text-white'
                                                            }`}>
                                                            {skill}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-gray-500">No path data.</div>
                    )}
                </div>
            </div>
        </div>
    );
};
