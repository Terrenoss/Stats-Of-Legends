import React from 'react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Legend,
    Tooltip
} from 'recharts';

interface LegendScoreRadarProps {
    playerStats: {
        combat: number;
        objectives: number;
        vision: number;
        farming: number;
        survival: number;
        aggressiveness: number; // Added aggressiveness
    };
    averageStats?: { // Optional: Average stats for the tier
        combat: number;
        objectives: number;
        vision: number;
        farming: number;
        survival: number;
        aggressiveness: number;
    };
    comparisons?: {
        name: string;
        stats: {
            combat: number;
            objectives: number;
            vision: number;
            farming: number;
            survival: number;
            aggressiveness: number;
        };
        color: string;
    }[];
    averageLabel?: string; // Optional: Label for the average polygon
}

export const LegendScoreRadar: React.FC<LegendScoreRadarProps> = ({ playerStats, averageStats, comparisons = [], averageLabel = 'Tier Avg' }) => {

    const DEFAULT_SCORE = 50;

    // Default "Average" if not provided
    const avg = averageStats || {
        combat: DEFAULT_SCORE,
        objectives: DEFAULT_SCORE,
        vision: DEFAULT_SCORE,
        farming: DEFAULT_SCORE,
        survival: DEFAULT_SCORE,
        aggressiveness: DEFAULT_SCORE
    };

    const radarData = [
        { subject: 'Combat', A: playerStats.combat, B: avg.combat, fullMark: 100 },
        { subject: 'Objectives', A: playerStats.objectives, B: avg.objectives, fullMark: 100 },
        { subject: 'Vision', A: playerStats.vision, B: avg.vision, fullMark: 100 },
        { subject: 'Farming', A: playerStats.farming, B: avg.farming, fullMark: 100 },
        { subject: 'Survival', A: playerStats.survival, B: avg.survival, fullMark: 100 },
        { subject: 'Laning Phase', A: playerStats.aggressiveness, B: avg.aggressiveness, fullMark: 100 },
    ];

    // Inject comparison data
    comparisons.forEach((comp, idx) => {
        const key = `C${idx}`;
        const combatStat = (comp.stats && comp.stats.combat !== undefined) ? comp.stats.combat : 0;
        radarData[0][key] = combatStat;
        radarData[1][key] = (comp.stats && comp.stats.objectives !== undefined) ? comp.stats.objectives : 0;
        radarData[2][key] = (comp.stats && comp.stats.vision !== undefined) ? comp.stats.vision : 0;
        radarData[3][key] = (comp.stats && comp.stats.farming !== undefined) ? comp.stats.farming : 0;
        radarData[4][key] = (comp.stats && comp.stats.survival !== undefined) ? comp.stats.survival : 0;
        radarData[5][key] = (comp.stats && comp.stats.aggressiveness !== undefined) ? comp.stats.aggressiveness : 0;
    });

    const FONT_SIZE_TICK = 12;
    const TICK_PADDING = 30;

    return (
        <div className="w-full h-[300px] bg-gray-900/50 rounded-xl border border-gray-800 p-4">
            <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Performance Breakdown</h3>
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: FONT_SIZE_TICK }} />
                    <PolarRadiusAxis angle={TICK_PADDING} domain={[0, 100]} tick={false} axisLine={false} />

                    {/* Player (You) */}
                    <Radar
                        name="You"
                        dataKey="A"
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        fill="#8b5cf6"
                        fillOpacity={0.3}
                    />

                    {/* Average (Tier) */}
                    <Radar
                        name={averageLabel}
                        dataKey="B"
                        stroke="#9CA3AF"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        fill="transparent"
                        fillOpacity={0.1}
                    />

                    {/* Comparisons */}
                    {comparisons.map((comp, idx) => (
                        <Radar
                            key={idx}
                            name={comp.name}
                            dataKey={`C${idx}`}
                            stroke={comp.color}
                            strokeWidth={3}
                            fill={comp.color}
                            fillOpacity={0.3}
                        />
                    ))}

                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6' }}
                        itemStyle={{ color: '#F3F4F6' }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};
