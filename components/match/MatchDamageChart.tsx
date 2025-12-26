import React from 'react';
import Image from 'next/image';
import { Participant } from '../../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface MatchDamageChartProps {
  participants: Participant[];
  lang: string;
}

export const MatchDamageChart: React.FC<MatchDamageChartProps> = ({ participants }) => {
  const team100 = participants.filter(p => p.teamId === 100);
  const team200 = participants.filter(p => p.teamId === 200);

  const calculateTotal = (team: Participant[], key: keyof Participant) =>
    team.reduce((acc, p) => acc + (typeof p[key] === 'number' ? (p[key] as number) : 0), 0);

  const metrics = [
    { label: 'Champions Killed', key: 'kills' as keyof Participant, color: '#C8AA6E' }, // Gold
    { label: 'Gold Earned', key: 'goldEarned' as keyof Participant, color: '#F0E6D2' }, // Light Gold
    { label: 'Damage Dealt', key: 'totalDamageDealtToChampions' as keyof Participant, color: '#C23030' }, // Red
    { label: 'Wards Placed', key: 'visionScore' as keyof Participant, color: '#9333EA' }, // Hextech
    { label: 'Damage Taken', key: 'totalDamageTaken' as keyof Participant, color: '#555' }, // Grey (use actual taken field)
    { label: 'CS', key: 'cs' as keyof Participant, color: '#60A5FA' }, // Blue
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
      {metrics.map((metric, idx) => (
        <StatComparisonCard
          key={idx}
          label={metric.label}
          metricKey={metric.key}
          team100={team100}
          team200={team200}
          color={metric.color}
        />
      ))}
    </div>
  );
};

interface StatComparisonCardProps {
  label: string;
  metricKey: keyof Participant;
  team100: Participant[];
  team200: Participant[];
  color: string;
}

const StatComparisonCard: React.FC<StatComparisonCardProps> = ({ label, metricKey, team100, team200, color }) => {
  const t1Total = team100.reduce((acc, p) => acc + (Number(p[metricKey]) || 0), 0);
  const t2Total = team200.reduce((acc, p) => acc + (Number(p[metricKey]) || 0), 0);
  const total = t1Total + t2Total;

  // Find max value in this card for bar scaling
  const maxVal = Math.max(
    ...team100.map(p => Number(p[metricKey]) || 0),
    ...team200.map(p => Number(p[metricKey]) || 0)
  );

  const data = [
    { name: 'Blue', value: t1Total },
    { name: 'Red', value: t2Total },
  ];

  const COLORS = ['#3b82f6', '#ef4444']; // Blue / Red

  return (
    <div className="bg-[#121212] border border-white/5 rounded-xl p-4 shadow-lg flex flex-col gap-4">
      <div className="text-center text-xs font-bold text-white uppercase tracking-wider">{label}</div>

      <div className="flex items-center justify-between gap-4">
        {/* Team 100 List (Left) */}
        <div className="flex flex-col gap-1 w-24">
          {team100.map((p, i) => (
            <PlayerStatRow key={i} participant={p} metricKey={metricKey} maxVal={maxVal} align="right" color="#3b82f6" />
          ))}
        </div>

        {/* Center Chart */}
        <div className="relative w-28 h-28 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={35}
                outerRadius={45}
                dataKey="value"
                stroke="none"
                startAngle={90}
                endAngle={-270}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-[#3b82f6] text-sm font-bold">{t1Total.toLocaleString()}</div>
            <div className="w-full h-px bg-white/10 my-0.5"></div>
            <div className="text-[#ef4444] text-sm font-bold">{t2Total.toLocaleString()}</div>
          </div>
        </div>

        {/* Team 200 List (Right) */}
        <div className="flex flex-col gap-1 w-24">
          {team200.map((p, i) => (
            <PlayerStatRow key={i} participant={p} metricKey={metricKey} maxVal={maxVal} align="left" color="#ef4444" />
          ))}
        </div>
      </div>
    </div>
  );
};

interface PlayerStatRowProps {
  participant: Participant;
  metricKey: keyof Participant;
  maxVal: number;
  align: 'left' | 'right';
  color: string;
}

const PlayerStatRow: React.FC<PlayerStatRowProps> = ({ participant, metricKey, maxVal, align, color }) => {
  const val = Number(participant[metricKey]) || 0;
  const width = maxVal > 0 ? (val / maxVal) * 100 : 0;

  // Safe champion access and fallbacks
  const champImg = participant.champion?.imageUrl ?? null;
  const champName = participant.champion?.name ?? 'Unknown';
  const safeVal = typeof val === 'number' && !isNaN(val) ? val : 0;
  const safeWidth = maxVal > 0 ? Math.min(100, (safeVal / maxVal) * 100) : 0;

  return (
    <div className={`flex items-center gap-2 ${align === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>
      {champImg ? (
        <Image
          src={champImg}
          width={20}
          height={20}
          className={`w-5 h-5 rounded border ${participant.summonerName === 'Faker' ? 'border-lol-gold' : 'border-gray-800'}`}
          alt={champName}
        />
      ) : (
        <div className={`w-5 h-5 rounded border ${participant.summonerName === 'Faker' ? 'border-lol-gold' : 'border-gray-800'} bg-white/5 flex items-center justify-center text-[10px] font-bold text-gray-300`}>{(champName && typeof champName === 'string') ? champName.charAt(0) : '?'}</div>
      )}
      <div className={`flex flex-col w-full ${align === 'right' ? 'items-end' : 'items-start'}`}>
        <div className={`text-[9px] text-gray-300 font-mono leading-none mb-0.5`}>{safeVal.toLocaleString()}</div>
        <div className={`h-1 bg-gray-800 rounded-full w-full flex ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
          <div style={{ width: `${safeWidth}%`, backgroundColor: color }} className="h-full rounded-full opacity-80"></div>
        </div>
      </div>
    </div>
  );
};
