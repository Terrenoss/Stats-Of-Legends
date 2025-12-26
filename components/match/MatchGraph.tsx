
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { MatchTimelinePoint } from '../../types';

interface MatchGraphProps {
  data: MatchTimelinePoint[];
}

export const MatchGraph: React.FC<MatchGraphProps> = ({ data }) => {
  return (
    <div className="h-72 w-full bg-[#121212] p-6 rounded-xl border border-white/5 shadow-inner">
       <div className="flex justify-between items-center mb-4 px-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Team Advantage (AI Score)</span>
          <div className="flex gap-4">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                <span className="text-[10px] text-gray-400 font-bold">Blue Team</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-[10px] text-gray-400 font-bold">Red Team</span>
             </div>
          </div>
       </div>
       <ResponsiveContainer width="100%" height="100%">
         <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
            <XAxis dataKey="timestamp" stroke="#555" tick={{fontSize: 10}} tickLine={false} axisLine={false} dy={10} />
            <YAxis stroke="#555" domain={[30, 70]} hide />
            <Tooltip 
              contentStyle={{ backgroundColor: '#09090b', border: '1px solid #333', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
              labelStyle={{ color: '#9ca3af', marginBottom: '4px', fontWeight: 'bold' }}
              itemStyle={{ padding: 0 }}
            />
            <ReferenceLine y={50} stroke="#444" strokeDasharray="5 5" />
            <Line type="monotone" dataKey="blueScore" stroke="#818cf8" strokeWidth={2} dot={{r:0}} activeDot={{r:4, strokeWidth: 0, fill: '#fff'}} />
            <Line type="monotone" dataKey="redScore" stroke="#f87171" strokeWidth={2} dot={{r:0}} activeDot={{r:4, strokeWidth: 0, fill: '#fff'}} />
         </LineChart>
       </ResponsiveContainer>
       <div className="flex justify-center gap-6 mt-4 text-[10px] text-gray-600 font-mono">
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div> Baron Power Play</span>
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div> Dragon Soul</span>
       </div>
    </div>
  );
};