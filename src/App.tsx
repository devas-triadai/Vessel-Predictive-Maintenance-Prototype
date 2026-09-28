import { useEffect, useState, useRef } from 'react';
import { MachineCard } from './components/MachineCard';
import { AlertsPanel } from './components/AlertsPanel';
import { HeatmapWidget } from './components/HeatmapWidget';
import { MachineDetail } from './components/MachineDetail';
import { Simulator } from './simulator';
import { AlarmSynth } from './audio';
import { SystemData } from './types';
import { Shield, Activity, HardDrive, Users, Moon, Sun, Download } from 'lucide-react';
import { AnimatePresence } from 'motion/react';

export default function App() {
  const simulatorRef = useRef(new Simulator());
  const synthRef = useRef(new AlarmSynth());
  const [data, setData] = useState<SystemData>({ machines: [], alerts: [] });
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    // Enable sound compulsorily. Requires first user interaction to unlock AudioContext.
    synthRef.current.setEnabled(true);
    const unlockAudio = () => synthRef.current.init();
    document.addEventListener('click', unlockAudio, { once: true });
    return () => document.removeEventListener('click', unlockAudio);
  }, []);

  const handleExportFleetReport = () => {
    const reportList = [
      `NAVAL VESSEL ENGINE & TELEMETRY PREDICTIVE MAINTENANCE SYSTEM - FLEET STATUS REPORT`,
      `Date: ${new Date().toLocaleString()}`,
      `Overall Systems Active: ${data.machines.filter(m => m.status === 'Running').length} / ${data.machines.length}`,
      `Total Alerts (Unresolved): ${data.alerts.filter(a => !a.resolved).length}`,
      `=================================================`,
    ];

    data.machines.forEach(m => {
      reportList.push(`MACHINE: ${m.name}`);
      reportList.push(`Status: ${m.status} | Health Score: ${m.healthScore.toFixed(1)}/100`);
      reportList.push(`Est. RUL: ${Math.round((m.healthScore / 100) * 15000)} Hrs`);
      reportList.push(`Condition: ${m.alertLevel.toUpperCase()}`);
      reportList.push(`-------------------------------------------------`);
    });

    const blob = new Blob([reportList.join("\n")], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Fleet_Diagnostic_Report_${new Date().getTime()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };


  useEffect(() => {
    // Initial fetch
    setData(simulatorRef.current.getData());

    // Tick the simulation every 2 seconds
    const interval = setInterval(() => {
      simulatorRef.current.tick();
      setData(simulatorRef.current.getData());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleResolveAlert = (id: string) => {
    simulatorRef.current.resolveAlert(id);
    setData(simulatorRef.current.getData());
  };

  const handleAddLog = (id: string, log: string) => {
    simulatorRef.current.addManualLog(id, log);
    setData(simulatorRef.current.getData());
  };

  const handleInjectAnomaly = (id: string, level: 'attention' | 'danger') => {
    simulatorRef.current.injectAnomaly(id, level);
    setData(simulatorRef.current.getData());
  };

  const handleTogglePower = (id: string) => {
    simulatorRef.current.toggleMachineStatus(id);
    setData(simulatorRef.current.getData());
  };

  const criticalCount = data.alerts.filter(a => !a.resolved && a.level === 'danger').length;
  const attentionCount = data.alerts.filter(a => !a.resolved && a.level === 'attention').length;
  const overallSafetyStr = criticalCount > 0 ? 'CRITICAL' : attentionCount > 0 ? 'ATTENTION' : 'NOMINAL';
  const overallSafetyLevel = criticalCount > 0 ? 'danger' : attentionCount > 0 ? 'attention' : 'normal';
  const overallSafetyColor = criticalCount > 0 ? 'text-red-500' : attentionCount > 0 ? 'text-amber-500' : 'text-emerald-500';

  const runningMachines = data.machines.filter(m => m.status === 'Running');
  const aggregateHealth = runningMachines.length > 0 
    ? runningMachines.reduce((acc, m) => acc + m.healthScore, 0) / runningMachines.length 
    : 100;

  const totalSensors = data.machines.reduce((acc, m) => acc + Object.keys(m.parameters).length, 0);
  const activeSensors = runningMachines.reduce((acc, m) => acc + Object.keys(m.parameters).length, 0);

  useEffect(() => {
    synthRef.current.setLevel(overallSafetyLevel);
  }, [overallSafetyLevel]);

  useEffect(() => {
    if (isLightMode) {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  }, [isLightMode]);

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-300 font-sans overflow-hidden border-4 border-slate-900 selection:bg-indigo-500/30">
      {/* Top Navbar */}
      <header className="h-16 px-8 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg lg:text-xl font-bold text-white tracking-tight">Naval Vessel Engine & Telemetry Predictive Maintenance System</h1>
          </div>
          
          <div className="flex space-x-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase">System Status</span>
              <span className={`text-sm font-bold tracking-wider ${overallSafetyColor}`}>{overallSafetyStr}</span>
            </div>
            <div className="flex flex-col border-l border-slate-800 pl-4">
              <span className="text-[10px] text-slate-500 uppercase">Active Machines</span>
              <span className="text-sm text-emerald-400 font-mono">{runningMachines.length} / {data.machines.length}</span>
            </div>
            <div className="flex flex-col border-l border-slate-800 pl-4">
              <span className="text-[10px] text-slate-500 uppercase">Sensor Network</span>
              <span className="text-sm text-emerald-400 font-mono">{activeSensors} / {totalSensors}</span>
            </div>
            <div className="flex flex-col border-l border-slate-800 pl-4">
              <span className="text-[10px] text-slate-500 uppercase">Aggregate Health</span>
              <span className={`text-sm font-mono ${aggregateHealth >= 90 ? 'text-emerald-400' : aggregateHealth >= 70 ? 'text-amber-400' : 'text-rose-400'}`}>
                {aggregateHealth.toFixed(1)}/100
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={handleExportFleetReport}
            className="flex items-center gap-2 p-1.5 px-3 rounded border border-indigo-500/30 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors uppercase text-[10px] font-bold font-mono"
            title="Download Fleet Report"
          >
            <Download className="w-3.5 h-3.5" /> Fleet Report
          </button>
          <button
            onClick={() => setIsLightMode(!isLightMode)}
            className="p-1.5 rounded border border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Toggle Theme"
          >
            {isLightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => setIsAdmin(!isAdmin)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded border text-[10px] uppercase tracking-widest font-mono transition-colors ${
              isAdmin ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            {isAdmin ? 'Admin Officer' : 'Operator'}
          </button>
          <div className="px-3 py-1 bg-slate-800 rounded border border-slate-700 text-xs font-mono text-slate-300">
            {new Date().toISOString().split('T')[0]} MCR Active
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Column: Machinery Grid */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950 custom-scrollbar">
          <AnimatePresence mode="wait">
            {selectedMachineId ? (
              <MachineDetail 
                key="detail"
                machine={data.machines.find(m => m.id === selectedMachineId)!}
                onBack={() => setSelectedMachineId(null)}
                onInjectAnomaly={handleInjectAnomaly}
                onTogglePower={handleTogglePower}
                isAdmin={isAdmin}
              />
            ) : (
              <div className="max-w-6xl mx-auto space-y-8 h-full" key="grid">
                {/* Group machines by category to make it scannable */}
                {['Main Engine', 'Gear Box', 'Waterjet Propeller', 'DG / DA', 'HP Compressor'].map(category => {
                  const categoryMachines = data.machines.filter(m => m.category === category);
                  if (categoryMachines.length === 0) return null;
                  
                  return (
                    <section key={category}>
                      <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                        {category} <span className="h-px flex-1 bg-slate-800/50"></span>
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categoryMachines.map(machine => (
                          <MachineCard 
                            key={machine.id} 
                            machine={machine} 
                            onInjectAnomaly={handleInjectAnomaly} 
                            onTogglePower={handleTogglePower} 
                            isAdmin={isAdmin}
                            onClick={() => setSelectedMachineId(machine.id)}
                          />
                        ))}
                      </div>
                    </section>
                  )
                })}
                <HeatmapWidget machines={data.machines} />
              </div>
            )}
          </AnimatePresence>
        </main>

        {/* Right Column: AI Insights & Alerts side panel */}
        <aside className="w-96 shrink-0 h-full">
          <AlertsPanel 
            alerts={data.alerts} 
            onResolve={handleResolveAlert}
            onAddLog={handleAddLog}
            isAdmin={isAdmin}
          />
        </aside>

      </div>
    </div>
  );
}
