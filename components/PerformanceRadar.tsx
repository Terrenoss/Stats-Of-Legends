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
    combat: 50,
    objectives: 50,
    vision: 50,
    farming: 50,
    survival: 50,
    ...(metrics || {})
  };

  const data = [
    { subject: 'Combat', A: safe.combat, fullMark: 100 },
    { subject: 'Objectives', A: safe.objectives, fullMark: 100 },
    { subject: 'Vision', A: safe.vision, fullMark: 100 },
    { subject: 'Farming', A: safe.farming, fullMark: 100 },
    { subject: 'Survival', A: safe.survival, fullMark: 100 },
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
