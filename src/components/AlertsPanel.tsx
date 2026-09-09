import React, { useState } from 'react';
import { AlertRecord } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { AlertOctagon, AlertTriangle, CheckCircle, Clock, Wrench, Edit3 } from 'lucide-react';

interface AlertsPanelProps {
  alerts: AlertRecord[];
  onResolve: (id: string) => void;
  onAddLog: (id: string, log: string) => void;
  isAdmin: boolean;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, onResolve, onAddLog, isAdmin }) => {
  const [filterTab, setFilterTab] = useState<'all' | 'unresolved' | 'logs'>('unresolved');
  const [logInput, setLogInput] = useState<{ id: string, text: string } | null>(null);

  const unresolvedAlerts = alerts.filter(a => !a.resolved);
  const logAlerts = alerts.filter(a => a.resolved);

  const displayAlerts = 
    filterTab === 'unresolved' ? unresolvedAlerts :
    filterTab === 'logs' ? logAlerts :
    alerts;

  const handleLogSubmit = (id: string) => {
    if (logInput?.text) {
      onAddLog(id, logInput.text);
      setLogInput(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/30 border-l border-slate-800 overflow-hidden">
      {/* Header Tabs */}
      <div className="flex p-5 border-b border-slate-800 gap-4 shrink-0 bg-slate-900/30">
        <button 
          onClick={() => setFilterTab('all')}
          className={`flex-1 pb-2 font-mono text-xs uppercase tracking-widest border-b-2 transition-colors ${filterTab === 'all' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
          All ({alerts.length})
        </button>
        <button 
          onClick={() => setFilterTab('unresolved')}
          className={`flex-1 pb-2 font-mono text-xs uppercase tracking-widest border-b-2 transition-colors ${filterTab === 'unresolved' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
          Unresolved ({unresolvedAlerts.length})
        </button>
        <button 
          onClick={() => setFilterTab('logs')}
          className={`flex-1 pb-2 font-mono text-xs uppercase tracking-widest border-b-2 transition-colors ${filterTab === 'logs' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
          Logs ({logAlerts.length})
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {displayAlerts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-48 text-slate-500"
            >
              <CheckCircle className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm font-mono text-xs">System Synchronized</p>
            </motion.div>
          ) : (
            displayAlerts.map((alert) => (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-4 rounded border shadow-lg shadow-black/20 ${alert.level === 'danger' && !alert.resolved ? 'bg-rose-900/10 border-rose-500/30' : alert.resolved ? 'bg-slate-900 border-slate-800' : 'bg-amber-900/10 border-amber-500/30'}`}
              >
                <div className="flex items-start gap-3">
                  {alert.level === 'danger' && !alert.resolved ? (
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, -10, 10, -10, 0]
                      }}
                      transition={{ 
                        duration: 0.5, 
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut"
                      }}
                      className="shrink-0 mt-0.5"
                    >
                      <AlertOctagon className="w-5 h-5 text-rose-500" />
                    </motion.div>
                  ) : alert.resolved ? (
                    <CheckCircle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-sm font-bold ${alert.resolved ? 'text-slate-400' : 'text-slate-200'}`}>
                        {alert.machineName}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <p className={`text-xs mb-3 ${alert.resolved ? 'text-slate-500' : 'text-slate-300'}`}>
                      {alert.message}
                    </p>

                    <div className="space-y-2 text-[11px] font-mono">
                      <div className="flex gap-2 text-slate-400">
                        <Wrench className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                        <span><strong className="text-slate-500 uppercase">Action:</strong> {alert.recommendedAction}</span>
                      </div>
                      {!alert.resolved && (
                        <div className="flex gap-2 text-slate-400">
                          <Clock className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                          <span><strong className="text-slate-500 uppercase">Est. Life:</strong> {alert.remainingLife}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex gap-2 justify-end font-mono">
                      {!isAdmin && !alert.resolved ? (
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Admin required for actions</span>
                      ) : isAdmin ? (
                        logInput?.id === alert.id ? (
                          <div className="flex gap-2 w-full">
                            <input 
                              type="text" 
                              className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                              placeholder="Operator notes (assisted learning)..."
                              value={logInput.text}
                              onChange={(e) => setLogInput({ id: alert.id, text: e.target.value })}
                              onKeyDown={(e) => e.key === 'Enter' && handleLogSubmit(alert.id)}
                              autoFocus
                            />
                            <button 
                              onClick={() => handleLogSubmit(alert.id)}
                              className="bg-indigo-600/20 border border-indigo-600/30 hover:bg-indigo-600/30 text-indigo-400 px-3 py-1 rounded text-[10px] uppercase tracking-widest transition-colors flex items-center"
                            >
                              Save Option
                            </button>
                          </div>
                        ) : (
                          <>
                            <button 
                              onClick={() => setLogInput({ id: alert.id, text: '' })}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] uppercase tracking-widest transition-colors"
                            >
                              <Edit3 className="w-3 h-3" /> Add Log
                            </button>
                            {!alert.resolved && (
                              <button 
                                onClick={() => onResolve(alert.id)}
                                className="px-3 py-1.5 rounded bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 text-[10px] uppercase tracking-widest transition-colors"
                              >
                                Resolve
                              </button>
                            )}
                          </>
                        )
                      ) : null}
                    </div>

                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
