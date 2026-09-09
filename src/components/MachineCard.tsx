import React from 'react';
import { MachineState } from '../types';
import { Activity, Gauge, Zap, Thermometer, AlertTriangle, Power } from 'lucide-react';
import { motion } from 'motion/react';
import { ResponsiveContainer, LineChart, Line, YAxis } from 'recharts';

interface MachineCardProps {
  machine: MachineState;
  onInjectAnomaly?: (id: string, level: 'attention' | 'danger') => void;
  onTogglePower?: (id: string) => void;
  isAdmin?: boolean;
  onClick?: () => void;
}

export const MachineCard: React.FC<MachineCardProps> = ({ machine, onInjectAnomaly, onTogglePower, isAdmin, onClick }) => {
  const isStopped = machine.status === 'Stopped';
  
  const healthColor = 
    machine.healthScore >= 90 ? 'text-green-500' : 
    machine.healthScore >= 50 ? 'text-yellow-500' : 'text-red-500';

  const healthBg = 
    machine.healthScore >= 90 ? 'bg-green-500/20' : 
    machine.healthScore >= 50 ? 'bg-yellow-500/20' : 'bg-red-500/20';

  const strokeColor = 
    machine.healthScore >= 90 ? '#22c55e' : 
    machine.healthScore >= 50 ? '#eab308' : '#ef4444';

  const circumference = 2 * Math.PI * 26; // r=26
  const strokeDashoffset = circumference - (machine.healthScore / 100) * circumference;

  const getCardClasses = () => {
    if (machine.alertLevel === 'danger') {
      return 'bg-rose-900/10 border-rose-500/30 hover:border-rose-500/50 shadow-lg shadow-black/20';
    }
    if (machine.alertLevel === 'attention') {
      return 'bg-amber-900/10 border-amber-500/30 hover:border-amber-500/50 shadow-lg shadow-black/20';
    }
    return 'bg-slate-900 border-slate-800 hover:border-emerald-500/50 shadow-lg shadow-black/20';
  };

  return (
    <motion.div 
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded p-4 flex flex-col gap-4 relative overflow-hidden transition-all cursor-pointer ${getCardClasses()}`}
    >
      {/* Background glow if Danger */}
      {machine.alertLevel === 'danger' && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-3xl rounded-full" />
      )}

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-white">{machine.name}</h3>
          <p className="text-xs font-mono text-slate-500 mt-0.5">{machine.category}</p>
        </div>
        <div className="flex items-center gap-2">
          {!isStopped && onInjectAnomaly && (
            <div className="flex gap-1 mr-2 opacity-50 hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => { e.stopPropagation(); onInjectAnomaly(machine.id, 'attention') }}
                className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold font-mono bg-amber-500/20 text-amber-500 hover:bg-amber-500/40 transition-colors"
                title="Trigger Warning"
              >
                W
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onInjectAnomaly(machine.id, 'danger') }}
                className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold font-mono bg-rose-500/20 text-rose-500 hover:bg-rose-500/40 transition-colors"
                title="Trigger Danger"
              >
                D
              </button>
            </div>
          )}
          {onTogglePower && isAdmin && (
            <button
              onClick={(e) => { e.stopPropagation(); onTogglePower(machine.id) }}
              className={`mr-2 p-1 rounded-full transition-colors ${
                isStopped ? 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300' : 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/40'
              }`}
              title={isStopped ? "Start Engine" : "Stop Engine"}
            >
              <Power className="w-3 h-3" />
            </button>
          )}
          <div className={`w-2 h-2 rounded-full ${isStopped ? 'bg-slate-500' : machine.alertLevel === 'danger' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' : machine.alertLevel === 'attention' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'}`} />
        </div>
      </div>

      {/* Main Content: Health & Primary Stat */}
      <div className="flex items-center gap-4">
        {/* Circular Health Score */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="w-16 h-16 transform -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="26"
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              className="text-slate-800"
            />
            {!isStopped && (
              <motion.circle
                cx="32"
                cy="32"
                r="26"
                stroke={strokeColor}
                strokeWidth="4"
                fill="transparent"
                strokeLinecap="round"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{ strokeDasharray: circumference }}
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-lg font-bold ${isStopped ? 'text-slate-500' : healthColor}`}>
              {isStopped ? '-' : Math.round(machine.healthScore)}
            </span>
          </div>
        </div>

        {/* Dynamic Parameters Grid */}
        <div className="flex-1 space-y-1 font-mono text-[11px]">
          {machine.parameters.rpm !== undefined && (
            <div className="flex justify-between">
              <span className="text-slate-500 uppercase">RPM</span>
              <span className={`${machine.overspeed ? 'text-rose-400 font-bold' : 'text-slate-200'}`}>
                {isStopped ? 0 : machine.parameters.rpm.toFixed(0)}
              </span>
            </div>
          )}
          {machine.parameters.outputRpm !== undefined && (
            <div className="flex justify-between">
              <span className="text-slate-500 uppercase">OUT RPM</span>
              <span className="text-slate-200">
                {isStopped ? 0 : machine.parameters.outputRpm.toFixed(0)}
              </span>
            </div>
          )}
          {machine.parameters.speedRatio !== undefined && (
            <div className="flex justify-between">
              <span className="text-slate-500 uppercase">RATIO</span>
              <span className="text-slate-200">
                {machine.parameters.speedRatio.toFixed(2)}
              </span>
            </div>
          )}
          {machine.parameters.vibration !== undefined && (
            <div className="flex justify-between">
              <span className="text-slate-500 uppercase">VIB</span>
              <span className="text-slate-200">{isStopped ? '0.0' : machine.parameters.vibration.toFixed(1)}</span>
            </div>
          )}
          {machine.parameters.power !== undefined && (
            <div className="flex justify-between">
              <span className="text-slate-500 uppercase">PWR</span>
              <span className="text-slate-200">{isStopped ? 0 : machine.parameters.power.toFixed(0)}</span>
            </div>
          )}
          {machine.parameters.frequency !== undefined && (
            <div className="flex justify-between">
              <span className="text-slate-500 uppercase">FREQ</span>
              <span className="text-slate-200">{isStopped ? 0 : machine.parameters.frequency.toFixed(1)}</span>
            </div>
          )}
          {machine.parameters.temperature !== undefined && (
            <div className="flex justify-between">
              <span className="text-slate-500 uppercase">TEMP</span>
              <span className="text-slate-200">{isStopped ? 'Amb' : machine.parameters.temperature.toFixed(1)}°C</span>
            </div>
          )}
          {machine.parameters.pressure !== undefined && (
            <div className="flex justify-between">
              <span className="text-slate-500 uppercase">PRES</span>
              <span className="text-slate-200">{isStopped ? 0 : machine.parameters.pressure.toFixed(1)}</span>
            </div>
          )}
          {machine.parameters.flowRate !== undefined && (
            <div className="flex justify-between">
              <span className="text-slate-500 uppercase">FLOW</span>
              <span className="text-slate-200">{isStopped ? 0 : machine.parameters.flowRate.toFixed(1)}</span>
            </div>
          )}
          {machine.parameters.thrust !== undefined && (
            <div className="flex justify-between">
              <span className="text-slate-500 uppercase">THRST</span>
              <span className="text-slate-200">{isStopped ? 0 : machine.parameters.thrust.toFixed(0)}</span>
            </div>
          )}
          <div className="flex justify-between mt-2 pt-2 border-t border-slate-800">
             <span className="text-slate-500 uppercase">ETA</span>
             <span className={`font-bold ${
               machine.healthScore >= 90 ? 'text-emerald-500' : 
               machine.healthScore >= 70 ? 'text-amber-500' : 'text-rose-500'
             }`}>
               {isStopped ? '-' : `${Math.round((machine.healthScore / 100) * 15000).toLocaleString()}h`}
             </span>
          </div>
        </div>
      </div>

      {/* Small Sparkline for Vibration */}
      {machine.vibrationHistory && machine.vibrationHistory.length > 0 && !isStopped && (
        <div className="h-6 mt-1 mb-1 w-full opacity-70" title="Recent Vibration History">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={machine.vibrationHistory.map((v, i) => ({ val: v, idx: i }))}>
              <YAxis domain={['auto', 'auto']} hide />
              <Line 
                type="monotone" 
                dataKey="val" 
                stroke={machine.alertLevel === 'danger' ? '#f43f5e' : machine.alertLevel === 'attention' ? '#f59e0b' : '#38bdf8'} 
                strokeWidth={1.5} 
                dot={false} 
                isAnimationActive={false} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Warnings / Alerts Footer */}
      {(machine.alertLevel !== 'normal' || machine.overspeed) && !isStopped && (
        <div className={`mt-2 p-2 rounded text-[10px] uppercase tracking-tighter flex items-start gap-2 border ${machine.alertLevel === 'danger' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <span className="font-semibold">{machine.alertLevel === 'danger' ? 'DANGER ZONE' : 'ATTENTION REQUIRED'}</span>
            {machine.overspeed && <span>Overspeed warning active</span>}
          </div>
        </div>
      )}
    </motion.div>
  );
};
