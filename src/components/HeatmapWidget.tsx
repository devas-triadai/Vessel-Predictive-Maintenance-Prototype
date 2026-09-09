import React, { useMemo } from 'react';
import { MachineState } from '../types';

interface HeatmapWidgetProps {
  machines: MachineState[];
}

export const HeatmapWidget: React.FC<HeatmapWidgetProps> = ({ machines }) => {
  // Generate stable synthetic data for the last 24 hours so it doesn't flicker on re-renders,
  // but simulates historical activity.
  const allHistory = useMemo(() => {
    return machines.map(m => {
      const data = Array(24).fill(0);
      
      // Inject one anomaly for "Main Engine 2" somewhere in the past
      if (m.name.toLowerCase() === 'main engine 2') {
         data[8] = 2; // Medium severity anomaly at T-16H
      }

      return { id: m.id, name: m.name, history: data };
    });
  }, [machines.length]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded p-4 mb-8 shadow-lg shadow-black/20">
      <div className="flex justify-between items-end mb-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">24H Anomaly Frequency</h3>
        <div className="flex flex-col items-end">
          <span className="text-[9px] text-slate-500 font-mono tracking-widest">-24H TO NOW</span>
          <div className="flex items-center gap-1.5 mt-1 opacity-70">
            <span className="text-[8px] font-mono text-slate-500">LOW</span>
            <div className="w-2 h-2 rounded-sm bg-slate-800/40" />
            <div className="w-2 h-2 rounded-sm bg-amber-500/30" />
            <div className="w-2 h-2 rounded-sm bg-amber-500/70" />
            <div className="w-2 h-2 rounded-sm bg-rose-500/80" />
            <span className="text-[8px] font-mono text-slate-500">HIGH</span>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
         <div className="min-w-[600px] flex flex-col gap-1">
           {machines.map(m => {
              const machineData = allHistory.find(h => h.id === m.id);
              const history = machineData ? [...machineData.history] : Array(24).fill(0);
              
              // Integrate real-time state for the current hour (last box)
              if (m.alertLevel === 'attention') history[23] += 1;
              if (m.alertLevel === 'danger') history[23] += 2;
              
              return (
                  <div key={m.id} className="flex items-center gap-3 group">
                    <span className="w-32 text-[10px] font-mono text-slate-500 truncate group-hover:text-slate-300 transition-colors">
                      {m.name}
                    </span>
                    <div className="flex-1 flex gap-0.5">
                      {history.map((val, idx) => {
                          let bg = 'bg-slate-800/40';
                          if (val === 1) bg = 'bg-amber-500/30';
                          else if (val === 2) bg = 'bg-amber-500/70 hover:bg-amber-400/80';
                          else if (val >= 3) bg = 'bg-rose-500/80 hover:bg-rose-400';
                          
                          return (
                              <div 
                                key={idx} 
                                className={`flex-1 h-3.5 rounded-sm ${bg} transition-colors duration-300`} 
                                title={`${val} anomalies at T-${24-idx}H for ${m.name}`} 
                              />
                          )
                      })}
                    </div>
                  </div>
              )
           })}
         </div>
      </div>
    </div>
  );
};
