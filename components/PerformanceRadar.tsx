"use client";

import React, { useEffect, useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from 'recharts';
import { PerformanceMetrics } from '../types';

interface PerformanceRadarProps {
  metrics: PerformanceMetrics | null;
  consistencyBadge?: string;
}

export const PerformanceRadar: React.FC<PerformanceRadarProps> = ({ metrics, consistencyBadge }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Default values if metrics are missing
  const safe = {
    dpm: 0,
    csm: 0,
    kda: 0,
    gpm: 0,
    vision: 0, // Not in PerformanceMetrics yet
    objectives: 0, // Not in PerformanceMetrics yet
    ...(metrics || {})
  };

  // Z-Score to 0-100 Scale Mapping (approximate)
  // We simulate Z-scores from raw stats for now since we don't have baselines here
  const normalize = (val: number, baseline: number, stdDev: number) => {
    if (!val) return 50; // Default to average if missing
    const z = (val - baseline) / stdDev;
    // Increased scaling factor from 20 to 25 to make the chart more dynamic/filled
    return Math.max(10, Math.min(100, 50 + (z * 25)));
  };

  const data = [
    { subject: 'Combat', A: normalize(safe.dpm, 500, 200), fullMark: 100 },
    { subject: 'Objectives', A: 65, fullMark: 100 }, // Placeholder - slightly above average
    { subject: 'Vision', A: 60, fullMark: 100 }, // Placeholder - slightly above average
    { subject: 'Farming', A: normalize(safe.csm, 6, 2), fullMark: 100 },
    { subject: 'Survival', A: normalize(safe.kda, 3, 1.5), fullMark: 100 },
  ];

  // Debug logging
  useEffect(() => {
    if (metrics) {
      console.log('PerformanceRadar Metrics:', metrics);
      console.log('PerformanceRadar Data:', data);
    } else {
      console.warn('PerformanceRadar: No metrics provided');
    }
  }, [metrics]);

  if (!isMounted) {
    return <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">Loading Chart...</div>;
  }

  return (
    <div className="w-full h-full relative flex flex-col items-center justify-center min-h-[200px]">
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
      {consistencyBadge && (
        <div className="absolute bottom-2 right-2 flex flex-col items-end">
          <span className="text-[10px] text-gray-500 uppercase font-bold">Consistency</span>
          <span className={`text-xs font-black ${consistencyBadge === 'Rock Solid' ? 'text-blue-400' :
            consistencyBadge === 'Coinflip' ? 'text-red-400' : 'text-gray-400'
            }`}>
            {consistencyBadge}
          </span>
        </div>
      )}
    </div>
  );
};
