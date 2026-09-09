import React, { useState, useEffect } from 'react';
import { MachineState } from '../types';
import { ArrowLeft, Activity, Gauge, Zap, Thermometer, Info, ShieldAlert, Cpu, Wrench, Calendar, Plus, Settings2, Save, Download, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface MachineDetailProps {
  machine: MachineState;
  onBack: () => void;
  onInjectAnomaly?: (id: string, level: 'attention' | 'danger') => void;
  onTogglePower?: (id: string) => void;
  isAdmin?: boolean;
}

export const MachineDetail: React.FC<MachineDetailProps> = ({ machine, onBack, onInjectAnomaly, onTogglePower, isAdmin }) => {
  const isStopped = machine.status === 'Stopped';

  const specs = getSpecsForCategory(machine.category);
  const tallyPlate = getTallyPlate(machine);

  // Maintain local history of vibration for the chart
  const [vibrationHistory, setVibrationHistory] = useState<{ time: string, vibration: number }[]>([]);

  // Maintenance Logs State
  const [maintenanceLogs, setMaintenanceLogs] = useState<{date: string, desc: string, type: 'Past' | 'Upcoming'}[]>([
    { date: '2026-05-18', desc: 'Routine inspection and calibration.', type: 'Past' },
    { date: '2026-02-11', desc: 'Replaced worn bearing seals.', type: 'Past' },
  ]);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleDesc, setScheduleDesc] = useState('');

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (scheduleDate && scheduleDesc) {
      const newLog = { date: scheduleDate, desc: scheduleDesc, type: new Date(scheduleDate) >= new Date() ? 'Upcoming' : 'Past' } as {date: string, desc: string, type: 'Past' | 'Upcoming'};
      setMaintenanceLogs(prev => [...prev, newLog].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setScheduleDate('');
      setScheduleDesc('');
    }
  };

  const [thresholds, setThresholds] = useState({
    vibrationWarning: 2.0,
    vibrationDanger: 3.0,
    temperatureWarning: 80,
    temperatureDanger: 90,
  });
  const [savingThresholds, setSavingThresholds] = useState(false);

  const handleSaveThresholds = () => {
    setSavingThresholds(true);
    setTimeout(() => setSavingThresholds(false), 1500);
  };

  const handleExport = () => {
    const reportList = [
      `MACHINE DIAGNOSTIC REPORT: ${machine.name.toUpperCase()}`,
      `Date: ${new Date().toLocaleString()}`,
      `Status: ${machine.status} | Health Score: ${machine.healthScore.toFixed(1)}/100`,
      `Estimated Remaining Life (ETA): ${Math.round((machine.healthScore / 100) * 15000)} Hours`,
      `Alert Level: ${machine.alertLevel.toUpperCase()}`,
      `-------------------------------------------------`,
      `Telemetry Data:`
    ];
    
    Object.entries(machine.parameters).forEach(([key, val]) => {
      if (typeof val === 'number') {
        reportList.push(`${key.toUpperCase()}: ${val.toFixed(2)}`);
      }
    });

    reportList.push(`-------------------------------------------------`);
    reportList.push(`Maintenance History:`);
    maintenanceLogs.forEach(log => {
      reportList.push(`[${log.date}] - ${log.type}: ${log.desc}`);
    });

    const blob = new Blob([reportList.join("\n")], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${machine.name.replace(/\s+/g, '_')}_diagnostic_report.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (isStopped || machine.parameters.vibration === undefined) return;
    
    setVibrationHistory(prev => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      const newHistory = [...prev, { time: timeStr, vibration: Number(machine.parameters.vibration!.toFixed(2)) }];
      // Keep last 30 data points
      if (newHistory.length > 30) return newHistory.slice(newHistory.length - 30);
      return newHistory;
    });
  }, [machine.parameters.vibration, isStopped]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full space-y-6"
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">{machine.name}</h2>
            <p className="text-xs font-mono text-slate-500 uppercase">{machine.category}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold font-mono bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/30 transition-colors uppercase"
            title="Download Report"
          >
            <Download className="w-3.5 h-3.5" /> Export Report
          </button>
          {!isStopped && onInjectAnomaly && (
            <div className="flex gap-2">
              <button 
                onClick={() => onInjectAnomaly(machine.id, 'attention')}
                className="px-3 py-1 rounded text-xs font-bold font-mono bg-amber-500/20 border border-amber-500/30 text-amber-500 hover:bg-amber-500/30 transition-colors uppercase"
              >
                Trigger Warning
              </button>
              <button 
                onClick={() => onInjectAnomaly(machine.id, 'danger')}
                className="px-3 py-1 rounded text-xs font-bold font-mono bg-rose-500/20 border border-rose-500/30 text-rose-500 hover:bg-rose-500/30 transition-colors uppercase"
              >
                Trigger Danger
              </button>
            </div>
          )}
          {onTogglePower && isAdmin && (
            <button
              onClick={() => onTogglePower(machine.id)}
              className={`px-4 py-1.5 rounded text-xs font-mono uppercase tracking-widest transition-colors ${
                isStopped ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/40' : 'bg-rose-600/20 border border-rose-500/30 text-rose-400 hover:bg-rose-600/40'
              }`}
            >
              {isStopped ? "Start Unit" : "Stop Unit"}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Core Status Card */}
        <div className="col-span-1 bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col gap-4 shadow-lg shadow-black/20">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2">Status Overview</h3>
          
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-mono text-xs">OPERATIONAL STATE</span>
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${isStopped ? 'bg-slate-800 text-slate-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isStopped ? 'bg-slate-500' : 'bg-emerald-500 animate-pulse'}`} />
              {machine.status}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-mono text-xs">HEALTH SCORE</span>
            <span className={`text-xl font-bold ${
              machine.healthScore >= 90 ? 'text-emerald-500' : 
              machine.healthScore >= 50 ? 'text-amber-500' : 'text-rose-500'
            }`}>
              {isStopped ? '-' : Math.round(machine.healthScore)}/100
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-mono text-xs flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> EST. REMAINING LIFE</span>
            <span className={`text-sm font-bold font-mono tracking-wider ${
              machine.healthScore >= 90 ? 'text-emerald-500' : 
              machine.healthScore >= 70 ? 'text-amber-500' : 'text-rose-500'
            }`}>
              {isStopped ? '-' : `${Math.round((machine.healthScore / 100) * 15000).toLocaleString()} HRS`}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-mono text-xs">CONDITION</span>
            <span className={`text-xs font-semibold uppercase tracking-wider ${
              machine.alertLevel === 'danger' ? 'text-rose-500' : 
              machine.alertLevel === 'attention' ? 'text-amber-500' : 'text-emerald-500'
            }`}>
              {machine.alertLevel === 'normal' ? 'Nominal' : machine.alertLevel}
            </span>
          </div>
          
          {machine.overspeed && (
            <div className="mt-2 p-2 rounded bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-400 text-xs">
              <ShieldAlert className="w-4 h-4" />
              <span className="uppercase font-mono font-bold tracking-tight">Overspeed Detected</span>
            </div>
          )}
        </div>

        {/* Live Telemetry */}
        <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-lg shadow-black/20">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2 mb-4">Live Telemetry</h3>
          <div className="grid grid-cols-3 gap-6">
            {machine.parameters.rpm !== undefined && (
              <TelemetryMetric icon={<Gauge />} label={machine.category === 'Gear Box' ? 'Input Speed' : machine.category === 'Waterjet Propeller' ? 'Impeller Speed' : machine.category === 'DG / DA' ? 'Engine Speed' : 'Speed'} value={isStopped ? 0 : machine.parameters.rpm.toFixed(0)} unit="RPM" alert={machine.overspeed} />
            )}
            {machine.parameters.outputRpm !== undefined && (
              <TelemetryMetric icon={<Gauge />} label="Output Speed" value={isStopped ? 0 : machine.parameters.outputRpm.toFixed(0)} unit="RPM" />
            )}
            {machine.parameters.speedRatio !== undefined && (
              <TelemetryMetric icon={<Gauge />} label="Speed Ratio" value={machine.parameters.speedRatio.toFixed(3)} unit="" />
            )}
            {machine.parameters.power !== undefined && (
              <TelemetryMetric icon={<Zap />} label="Power Output" value={isStopped ? 0 : machine.parameters.power.toFixed(0)} unit="kW" />
            )}
            {machine.parameters.frequency !== undefined && (
              <TelemetryMetric icon={<Activity />} label="Electrical Frequency" value={isStopped ? 0 : machine.parameters.frequency.toFixed(1)} unit="Hz" alert={machine.status === 'Running' && Math.abs(machine.parameters.frequency - 50) > 2} />
            )}
            {machine.parameters.temperature !== undefined && (
              <TelemetryMetric icon={<Thermometer />} label={machine.category === 'Gear Box' ? 'Oil Temp' : machine.category === 'HP Compressor' ? 'Motor Temp' : 'Temperature'} value={isStopped ? 'Amb' : machine.parameters.temperature.toFixed(1)} unit="°C" alert={machine.parameters.temperature > 90} />
            )}
            {machine.parameters.vibration !== undefined && (
              <TelemetryMetric icon={<Activity />} label={machine.category === 'Gear Box' ? 'Torsional Vib' : 'Vibration'} value={isStopped ? '0.0' : machine.parameters.vibration.toFixed(2)} unit="mm/s" alert={machine.parameters.vibration > 3.0} />
            )}
            {machine.parameters.vibrationHz !== undefined && (
              <TelemetryMetric icon={<Activity />} label="Vibration Hz" value={isStopped ? '0.0' : machine.parameters.vibrationHz.toFixed(1)} unit="Hz" />
            )}
            {machine.parameters.pressure !== undefined && (
              <TelemetryMetric icon={<Gauge />} label="Discharge Pressure" value={isStopped ? 0 : machine.parameters.pressure.toFixed(1)} unit="Bar" alert={machine.status === 'Running' && machine.parameters.pressure < 25} />
            )}
            {machine.parameters.flowRate !== undefined && (
              <TelemetryMetric icon={<Activity />} label="Mass Flow Rate" value={isStopped ? 0 : machine.parameters.flowRate.toFixed(1)} unit="m³/hr" />
            )}
            {machine.parameters.thrust !== undefined && (
              <TelemetryMetric icon={<Gauge />} label="Thrust" value={isStopped ? 0 : machine.parameters.thrust.toFixed(0)} unit="kN" />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 flex-1">
        {/* Technical Specifications */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-lg p-5 shadow-lg shadow-black/20">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2 mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4" /> Technical Specifications
          </h3>
          <div className="space-y-3 font-mono text-sm">
            {Object.entries(specs).map(([key, val]) => (
              <div key={key} className="flex justify-between border-b border-slate-800/50 pb-2">
                <span className="text-slate-500">{key}</span>
                <span className="text-slate-300">{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Vibration Chart */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-lg p-5 shadow-lg shadow-black/20 flex flex-col">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Real-time Vibration Log
          </h3>
          <div className="flex-1 w-full h-48 min-h-[192px]">
            {vibrationHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vibrationHistory} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="time" stroke="#475569" fontSize={10} tickMargin={8} />
                  <YAxis stroke="#475569" fontSize={10} domain={['auto', 'auto']} tickFormatter={(v) => v.toFixed(1)} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '12px' }}
                    itemStyle={{ color: '#38bdf8' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="vibration" 
                    stroke="#38bdf8" 
                    strokeWidth={2} 
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 font-mono text-xs uppercase tracking-widest">
                {isStopped ? 'Unit Stopped - No Data' : 'Initializing signal...'}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
        {/* Tally Plate Data */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-lg p-5 shadow-lg shadow-black/20">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2 mb-4 flex items-center gap-2">
            <Info className="w-4 h-4" /> Tally / Diagram Plate
          </h3>
          <div className="space-y-3 font-mono text-sm">
            {Object.entries(tallyPlate).map(([key, val]) => (
              <div key={key} className="flex justify-between border-b border-slate-800/50 pb-2">
                <span className="text-slate-500">{key}</span>
                <span className="text-slate-300">{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Maintenance History & Scheduling */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-lg p-5 shadow-lg shadow-black/20">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2 mb-4 flex items-center gap-2">
            <Wrench className="w-4 h-4" /> Maintenance History & Scheduling
          </h3>
          
          <div className="flex flex-col gap-6">
            <form onSubmit={handleScheduleSubmit} className="flex flex-col gap-3 bg-slate-950/50 p-4 rounded border border-slate-800">
              <h4 className="text-xs uppercase tracking-widest text-slate-500 font-mono flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Schedule Service
              </h4>
              <div className="flex gap-3">
                <input 
                  type="date" 
                  value={scheduleDate}
                  onChange={e => setScheduleDate(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
                  required
                />
                <input 
                  type="text" 
                  value={scheduleDesc}
                  onChange={e => setScheduleDesc(e.target.value)}
                  placeholder="Service description..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
                  required
                />
                <button type="submit" className="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded text-sm font-semibold transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
            </form>

            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-widest text-slate-500 font-mono">Service Logs</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                {maintenanceLogs.map((log, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded bg-slate-800/30 border border-slate-800/50">
                    <div className={`mt-0.5 w-2 h-2 shrink-0 rounded-full ${log.type === 'Upcoming' ? 'bg-amber-400' : 'bg-slate-500'}`} />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-mono text-slate-400">{log.date}</span>
                        <span className={`text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded ${log.type === 'Upcoming' ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-700 text-slate-400'}`}>
                          {log.type}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300">{log.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Threshold Configuration (Admin Only) */}
        {isAdmin && (
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-lg p-5 shadow-lg shadow-black/20 md:col-span-2">
             <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2 mb-4 flex items-center gap-2">
                <Settings2 className="w-4 h-4" /> Sensor Thresholds Configuration
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {machine.parameters.vibration !== undefined && (
                   <div className="flex flex-col gap-2">
                     <label className="text-xs font-mono text-slate-500 uppercase">Vibration Thresholds (mm/s)</label>
                     <div className="flex gap-4">
                       <div className="flex-1 flex items-center gap-2 bg-slate-950/50 border border-amber-500/30 rounded px-3 py-1.5 focus-within:border-amber-500/60 transition-colors">
                         <span className="text-[10px] uppercase text-amber-500 font-bold w-12">Warn</span>
                         <input 
                           type="number" 
                           value={thresholds.vibrationWarning} 
                           onChange={e => setThresholds({...thresholds, vibrationWarning: parseFloat(e.target.value)})}
                           className="w-full bg-transparent border-none text-slate-300 text-sm font-mono focus:outline-none"
                           step="0.1"
                         />
                       </div>
                       <div className="flex-1 flex items-center gap-2 bg-slate-950/50 border border-rose-500/30 rounded px-3 py-1.5 focus-within:border-rose-500/60 transition-colors">
                         <span className="text-[10px] uppercase text-rose-500 font-bold w-12">Danger</span>
                         <input 
                           type="number" 
                           value={thresholds.vibrationDanger} 
                           onChange={e => setThresholds({...thresholds, vibrationDanger: parseFloat(e.target.value)})}
                           className="w-full bg-transparent border-none text-slate-300 text-sm font-mono focus:outline-none"
                           step="0.1"
                         />
                       </div>
                     </div>
                   </div>
                )}
                {machine.parameters.temperature !== undefined && (
                   <div className="flex flex-col gap-2">
                     <label className="text-xs font-mono text-slate-500 uppercase">Temperature Thresholds (°C)</label>
                     <div className="flex gap-4">
                       <div className="flex-1 flex items-center gap-2 bg-slate-950/50 border border-amber-500/30 rounded px-3 py-1.5 focus-within:border-amber-500/60 transition-colors">
                         <span className="text-[10px] uppercase text-amber-500 font-bold w-12">Warn</span>
                         <input 
                           type="number" 
                           value={thresholds.temperatureWarning} 
                           onChange={e => setThresholds({...thresholds, temperatureWarning: parseFloat(e.target.value)})}
                           className="w-full bg-transparent border-none text-slate-300 text-sm font-mono focus:outline-none"
                           step="0.1"
                         />
                       </div>
                       <div className="flex-1 flex items-center gap-2 bg-slate-950/50 border border-rose-500/30 rounded px-3 py-1.5 focus-within:border-rose-500/60 transition-colors">
                         <span className="text-[10px] uppercase text-rose-500 font-bold w-12">Danger</span>
                         <input 
                           type="number" 
                           value={thresholds.temperatureDanger} 
                           onChange={e => setThresholds({...thresholds, temperatureDanger: parseFloat(e.target.value)})}
                           className="w-full bg-transparent border-none text-slate-300 text-sm font-mono focus:outline-none"
                           step="0.1"
                         />
                       </div>
                     </div>
                   </div>
                )}
             </div>
             <div className="flex justify-start mt-6">
               <button onClick={handleSaveThresholds} className={`px-6 py-2 rounded text-sm font-semibold transition-colors flex items-center gap-2 ${savingThresholds ? 'bg-emerald-600/20 text-emerald-500 border border-emerald-500/30' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'}`}>
                 {savingThresholds ? 'Saved Successfully!' : <><Save className="w-4 h-4" /> Save Configuration</>}
               </button>
             </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const TelemetryMetric = ({ icon, label, value, unit, alert }: { icon: React.ReactNode, label: string, value: string | number, unit?: string, alert?: boolean }) => (
  <div className={`p-3 rounded-lg border ${alert ? 'bg-rose-500/10 border-rose-500/30' : 'bg-slate-950/50 border-slate-800'}`}>
    <div className="flex items-center gap-2 text-slate-500 mb-2">
      <div className="w-4 h-4 opacity-70">{icon}</div>
      <span className="text-[10px] uppercase font-mono tracking-widest">{label}</span>
    </div>
    <div className="flex items-baseline gap-1">
      <span className={`text-2xl font-bold ${alert ? 'text-rose-400' : 'text-slate-200'}`}>{value}</span>
      {unit && <span className="text-xs text-slate-500 font-mono">{unit}</span>}
    </div>
  </div>
);

function getSpecsForCategory(cat: string) {
  switch (cat) {
    case 'Main Engine': return { 'Power': '3000 KW', 'RPM': '2100', 'No. of Cylinder': '16' };
    case 'DG / DA': return { 'Power': '150 KW', 'RPM': '1500' };
    case 'Gear Box': return { 'Gear Ratio': '2.5 - 3.5' };
    case 'Waterjet Propeller': return { 'RPM': '800' };
    case 'HP Compressor': return { 'Flow Rate': '30 m3/hr', 'Pressure': '30 Bar' };
    default: return {};
  }
}

function getTallyPlate(machine: MachineState) {
  return {
    'Manufacturer': 'OEM Marine Systems Ltd.',
    'Serial No.': `SN-${machine.id.toUpperCase()}-${Math.floor(Math.random() * 10000)}`,
    'Type/Model': `${machine.category.substring(0,2).toUpperCase()}-900V`,
    'Year of Mfg': '2025',
    'Elec Params': machine.category === 'DG / DA' ? '415V AC, 3Ph, 50Hz' : '24V DC Control',
    'IP Rating': 'IP 44',
  };
}
