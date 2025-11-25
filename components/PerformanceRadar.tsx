
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

export const PerformanceRadar = () => {
  const data = [
    { subject: 'GPM', A: 120, fullMark: 150 },
    { subject: 'CSM', A: 98, fullMark: 150 },
    { subject: 'DPM', A: 86, fullMark: 150 },
    { subject: 'DMG%', A: 99, fullMark: 150 },
    { subject: 'KDA', A: 85, fullMark: 150 },
    { subject: 'XPD@15', A: 65, fullMark: 150 },
    { subject: 'CSD@15', A: 70, fullMark: 150 },
    { subject: 'GD@15', A: 110, fullMark: 150 },
  ];

  return (
    <div className="w-full h-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
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
