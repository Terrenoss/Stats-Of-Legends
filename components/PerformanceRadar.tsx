import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from 'recharts';

interface PerformanceRadarProps {
  metrics: {
    combat: number;
    objectives: number;
    vision: number;
    farming: number;
    survival: number;
    consistencyBadge?: string;
  } | null;
}

export const PerformanceRadar: React.FC<PerformanceRadarProps> = ({ metrics }) => {
  // Default values if metrics are missing
  const safe = {
    combat: 0,
    objectives: 0,
    vision: 0,
    farming: 0,
    survival: 0,
    ...(metrics || {})
  };

  // Z-Score to 0-100 Scale Mapping (approximate)
  // Z=0 -> 50, Z=2 -> 90, Z=-2 -> 10
  const zToScore = (z: number) => Math.max(0, Math.min(100, 50 + (z * 20)));

  const data = [
    { subject: 'Combat', A: zToScore(safe.combat), fullMark: 100 },
    { subject: 'Objectives', A: zToScore(safe.objectives), fullMark: 100 },
    { subject: 'Vision', A: zToScore(safe.vision), fullMark: 100 },
    { subject: 'Farming', A: zToScore(safe.farming), fullMark: 100 },
    { subject: 'Survival', A: zToScore(safe.survival), fullMark: 100 },
  ];

  return (
    <div className="w-full h-full relative flex flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#333" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 'bold' }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Performance"
            dataKey="A"
            stroke="#C084FC"
            strokeWidth={3}
            fill="#C084FC"
            fillOpacity={0.4}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Consistency Badge Display */}
      {metrics?.consistencyBadge && (
        <div className="absolute bottom-2 right-2 flex flex-col items-end">
          <span className="text-[10px] text-gray-500 uppercase font-bold">Consistency</span>
          <span className={`text-xs font-black ${metrics.consistencyBadge === 'Rock Solid' ? 'text-blue-400' :
              metrics.consistencyBadge === 'Coinflip' ? 'text-red-400' : 'text-gray-400'
            }`}>
            {metrics.consistencyBadge}
          </span>
        </div>
      )}
    </div>
  );
};
