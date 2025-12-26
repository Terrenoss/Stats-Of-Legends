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

    // Default "Average" if not provided
    const avg = averageStats || {
        combat: 50,
        objectives: 50,
        vision: 50,
        farming: 50,
        survival: 50,
        aggressiveness: 50
    };

    const data = [
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
        data[0][key] = comp.stats?.combat;
        data[1][key] = comp.stats?.objectives;
        data[2][key] = comp.stats?.vision;
        data[3][key] = comp.stats?.farming;
        data[4][key] = comp.stats?.survival;
        data[5][key] = comp.stats?.aggressiveness;
    });

    return (
        <div className="w-full h-[300px] bg-gray-900/50 rounded-xl border border-gray-800 p-4">
            <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Performance Breakdown</h3>
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />

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
