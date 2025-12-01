import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { PerformanceMetrics } from '../types';

interface PerformanceRadarProps {
  metrics: PerformanceMetrics | null;
}

export const PerformanceRadar: React.FC<PerformanceRadarProps> = ({ metrics }) => {
  const base: PerformanceMetrics = {
    gpm: 0,
    csm: 0,
    dpm: 0,
    dmgPercentage: 0,
    kda: 0,
    xpd15: 0,
    csd15: 0,
    gd15: 0,
  };
  const safe = { ...base, ...(metrics || {}) };

  const normalize = (value: number, min: number, max: number) => {
    if (max <= min) return 0;
    const clamped = Math.max(min, Math.min(max, value));
    return ((clamped - min) / (max - min)) * 150;
  };

  const data = [
    { subject: 'GPM', A: normalize(safe.gpm, 200, 700), desc: 'Gold par minute' },
    { subject: 'CSM', A: normalize(safe.csm, 3, 10), desc: 'CS par minute' },
    { subject: 'DPM', A: normalize(safe.dpm, 100, 2000), desc: 'Dégâts par minute' },
    { subject: 'DMG%', A: normalize(safe.dmgPercentage, 5, 40), desc: '% des dégâts de l\'équipe' },
    { subject: 'KDA', A: normalize(safe.kda, 1, 6), desc: 'Kills+Assists / Morts' },
    { subject: 'XPD@15', A: normalize(safe.xpd15, -500, 500), desc: 'Différence d\'XP à 15 min' },
    { subject: 'CSD@15', A: normalize(safe.csd15, -30, 30), desc: 'Différence de CS à 15 min' },
    { subject: 'GD@15', A: normalize(safe.gd15, -2000, 2000), desc: 'Différence de gold à 15 min' },
  ];

  const [hover, setHover] = React.useState<string | null>(null);

  return (
    <div className="w-full h-full relative">
      {hover && (
        <div className="absolute top-2 right-2 bg-black/80 text-[10px] text-gray-200 px-2 py-1 rounded border border-white/10 pointer-events-none">
          {data.find(d => d.subject === hover)?.desc}
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart
          cx="50%"
          cy="50%"
          outerRadius="80%"
          data={data}
          onMouseMove={(state: any) => {
            if (state && state.activeLabel) setHover(state.activeLabel as string);
          }}
          onMouseLeave={() => setHover(null)}
        >
          <PolarGrid stroke="#333" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 'bold' }} />
          <Radar
            name="Performance"
            dataKey="A"
            stroke="#9333EA"
            strokeWidth={2}
            fill="#9333EA"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
