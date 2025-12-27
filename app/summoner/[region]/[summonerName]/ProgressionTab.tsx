import React from 'react';
import { TrendingUp } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface ProgressionTabProps {
    lpHistory: any[];
    rankColor: string;
}

const DAYS_HISTORY = 30;
const Y_AXIS_PADDING = 20;
const FONT_SIZE = 10;

export const ProgressionTab: React.FC<ProgressionTabProps> = ({ lpHistory, rankColor }) => {
    return (
        <div className="bg-[#121212] border border-white/5 rounded-[2rem] p-8 shadow-xl animate-fadeIn">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-bold text-white font-display mb-1">Progression LP ({DAYS_HISTORY} Jours)</h3>
                    <p className="text-sm text-gray-500">Historique de vos gains et pertes de LP en Ranked Solo/Duo.</p>
                </div>
                {lpHistory.length > 1 && (
                    <div className={`px-4 py-2 rounded-xl border ${lpHistory[lpHistory.length - 1].lp - lpHistory[0].lp >= 0 ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                        <span className="text-lg font-black">{lpHistory[lpHistory.length - 1].lp - lpHistory[0].lp >= 0 ? '+' : ''}{lpHistory[lpHistory.length - 1].lp - lpHistory[0].lp} LP</span>
                    </div>
                )}
            </div>

            <div className="h-[400px] w-full">
                {lpHistory.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={lpHistory} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorLpMain" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={rankColor} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={rankColor} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="#666"
                                tick={{ fill: '#666', fontSize: FONT_SIZE }}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={DAYS_HISTORY}
                            />
                            <YAxis
                                stroke="#666"
                                tick={{ fill: '#666', fontSize: FONT_SIZE }}
                                tickLine={false}
                                axisLine={false}
                                domain={[`dataMin - ${Y_AXIS_PADDING}`, `dataMax + ${Y_AXIS_PADDING}`]}
                            />
                            <Tooltip
                                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-[#0f0e17] text-white p-3 rounded-xl shadow-2xl border border-white/10 text-xs backdrop-blur-md">
                                                <div className="font-bold text-lg mb-1" style={{ color: rankColor }}>{data.lp} LP</div>
                                                <div className="text-gray-400">{label}</div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="lp"
                                stroke={rankColor}
                                strokeWidth={3}
                                dot={{ r: 4, fill: '#121212', stroke: rankColor, strokeWidth: 2 }}
                                activeDot={{ r: 6, fill: rankColor, stroke: '#fff', strokeWidth: 2 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <TrendingUp size={48} className="mb-4 opacity-20" />
                        <p>Aucune donnée d'historique disponible pour le moment.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
