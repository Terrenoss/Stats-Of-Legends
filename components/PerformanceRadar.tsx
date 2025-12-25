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

  // Calculate average score for center display
  const averageScore = Math.round(data.reduce((acc, curr) => acc + curr.A, 0) / data.length);

  // Determine score grade
  const getGrade = (score: number) => {
    if (score >= 90) return 'S+';
    if (score >= 80) return 'S';
    if (score >= 70) return 'A';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C';
    return 'D';
  };

  const grade = getGrade(averageScore);

  if (!isMounted) {
    return <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">Loading Chart...</div>;
  }

  return (
    <div className="w-full h-full relative flex flex-col items-center justify-center min-h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#222" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 'bold' }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Performance"
            dataKey="A"
            stroke="#C084FC"
            strokeWidth={3}
            fill="#C084FC"
            fillOpacity={0.5}
            isAnimationActive={true}
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Central Score Display */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none z-20">
        <div className="animate-slam flex flex-col items-center">
          <span className={`text-6xl font-black font-cinzel drop-shadow-[0_0_25px_rgba(192,132,252,0.6)] ${grade.includes('S') ? 'text-gold-gradient' : 'text-white'}`}>
            {grade}
          </span>
          <span className="text-[10px] font-bold tracking-[0.2em] text-purple-200 uppercase mt-1 animate-pulse">
            {grade === 'S+' ? 'GODLIKE' :
              grade === 'S' ? 'DEMON KING' :
                grade === 'A' ? 'WARLORD' :
                  grade === 'B' ? 'GLADIATOR' :
                    grade === 'C' ? 'SOLDIER' : 'MORTAL'}
          </span>
        </div>
      </div>

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
