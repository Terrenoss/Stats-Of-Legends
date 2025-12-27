import React from 'react';
import { CheckSquare, Square } from 'lucide-react';

export const StatSection = ({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) => (
    <div>
        <h4 className="text-[10px] uppercase text-gray-500 font-bold mb-3 flex items-center gap-2 tracking-wider">
            {icon} {title}
        </h4>
        <div className="grid grid-cols-2 gap-y-2 gap-x-4">
            {children}
        </div>
    </div>
);

export const StatRow = ({ label, value, suffix = '', color = 'text-gray-300' }: any) => (
    <div className="flex justify-between items-baseline group">
        <span className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors truncate mr-2">{label}</span>
        <span className={`font-mono text-xs font-bold ${color} whitespace-nowrap`}>{value}{suffix}</span>
    </div>
);

export const DamageRow = ({ label, value, checked, onToggle, suffix }: any) => (
    <div
        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${checked ? 'bg-white/5 border border-white/5' : 'opacity-40 hover:opacity-70 border border-transparent'}`}
        onClick={onToggle}
    >
        <div className="flex items-center gap-3 overflow-hidden">
            {checked ? <CheckSquare className="w-4 h-4 text-lol-gold" /> : <Square className="w-4 h-4 text-gray-600" />}
            <span className="text-xs text-gray-300 truncate font-medium">{label} {suffix && <span className="text-[10px] text-gray-500 ml-1">{suffix}</span>}</span>
        </div>
        <span className="font-mono text-sm font-bold text-white whitespace-nowrap">{value}</span>
    </div>
);

export const DummyInput = ({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-[10px] text-gray-500 text-center font-bold tracking-wider">{label}</label>
        <input
            type="number"
            className="bg-[#080808] border border-white/10 text-white text-center text-sm py-2 rounded-xl focus:border-lol-gold outline-none transition-colors font-mono"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
        />
    </div>
);
