import { MachineState, AlertRecord, SystemData } from './types';

// Helper to generate a random ID
const genId = () => Math.random().toString(36).substr(2, 9);

const createInitialMachines = (): MachineState[] => [
  { id: 'me1', name: 'Main Engine 1', category: 'Main Engine', status: 'Running', healthScore: 100, alertLevel: 'normal', overspeed: false, parameters: { rpm: 2100, power: 3000, temperature: 85, vibration: 1.5, vibrationHz: 25.5 } },
  { id: 'me2', name: 'Main Engine 2', category: 'Main Engine', status: 'Running', healthScore: 100, alertLevel: 'normal', overspeed: false, parameters: { rpm: 2100, power: 3000, temperature: 84, vibration: 1.4, vibrationHz: 25.2 } },
  { id: 'me3', name: 'Main Engine 3', category: 'Main Engine', status: 'Running', healthScore: 100, alertLevel: 'normal', overspeed: false, parameters: { rpm: 2100, power: 3000, temperature: 86, vibration: 1.6, vibrationHz: 25.8 } },
  { id: 'dg1', name: 'DG / DA 1', category: 'DG / DA', status: 'Running', healthScore: 100, alertLevel: 'normal', overspeed: false, parameters: { rpm: 1500, power: 150, frequency: 50, vibration: 1.0 } },
  { id: 'dg2', name: 'DG / DA 2', category: 'DG / DA', status: 'Running', healthScore: 100, alertLevel: 'normal', overspeed: false, parameters: { rpm: 1500, power: 150, frequency: 50, vibration: 1.1 } },
  { id: 'dg3', name: 'DG / DA 3', category: 'DG / DA', status: 'Stopped', healthScore: 100, alertLevel: 'normal', overspeed: false, parameters: { rpm: 0, power: 0, frequency: 0, vibration: 0 } },
  { id: 'gb1', name: 'Gear Box 1', category: 'Gear Box', status: 'Running', healthScore: 100, alertLevel: 'normal', overspeed: false, parameters: { rpm: 2100, outputRpm: 800, speedRatio: 2.625, temperature: 65, vibration: 2.0 } },
  { id: 'gb2', name: 'Gear Box 2', category: 'Gear Box', status: 'Running', healthScore: 100, alertLevel: 'normal', overspeed: false, parameters: { rpm: 2100, outputRpm: 800, speedRatio: 2.625, temperature: 66, vibration: 2.1 } },
  { id: 'gb3', name: 'Gear Box 3', category: 'Gear Box', status: 'Running', healthScore: 100, alertLevel: 'normal', overspeed: false, parameters: { rpm: 2100, outputRpm: 800, speedRatio: 2.625, temperature: 64, vibration: 1.9 } },
  { id: 'wp1', name: 'Waterjet Prop 1', category: 'Waterjet Propeller', status: 'Running', healthScore: 100, alertLevel: 'normal', overspeed: false, parameters: { rpm: 800, flowRate: 30, thrust: 250, vibration: 2.5 } },
  { id: 'wp2', name: 'Waterjet Prop 2', category: 'Waterjet Propeller', status: 'Running', healthScore: 100, alertLevel: 'normal', overspeed: false, parameters: { rpm: 800, flowRate: 30, thrust: 248, vibration: 2.4 } },
  { id: 'wp3', name: 'Waterjet Prop 3', category: 'Waterjet Propeller', status: 'Running', healthScore: 100, alertLevel: 'normal', overspeed: false, parameters: { rpm: 800, flowRate: 30, thrust: 252, vibration: 2.6 } },
  { id: 'hpc1', name: 'HP Compressor 1', category: 'HP Compressor', status: 'Running', healthScore: 100, alertLevel: 'normal', overspeed: false, parameters: { pressure: 30, temperature: 45, vibration: 1.2 } },
  { id: 'hpc2', name: 'HP Compressor 2', category: 'HP Compressor', status: 'Stopped', healthScore: 100, alertLevel: 'normal', overspeed: false, parameters: { pressure: 0, temperature: 0, vibration: 0 } },
];

// Add small Gaussian noise
const randomWalk = (value: number, maxVariance: number) => {
  const noise = (Math.random() - 0.5) * 2 * maxVariance;
  return Number((value + noise).toFixed(2));
};

export class Simulator {
  private machines: MachineState[];
  private alerts: AlertRecord[];

  constructor() {
    this.machines = createInitialMachines();
    this.alerts = [];
  }

  public getData(): SystemData {
    return {
      machines: [...this.machines],
      alerts: [...this.alerts],
    };
  }

  public resolveAlert(alertId: string) {
    const targetAlert = this.alerts.find(a => a.id === alertId);
    if (!targetAlert) return;
    const machineId = targetAlert.machineId;

    // Resolve ALL alerts for this machine
    this.alerts = this.alerts.map(a => 
      a.machineId === machineId ? { ...a, resolved: true } : a
    );

    // Reset machine health
    this.machines = this.machines.map(m => {
      if (m.id === machineId) {
        let defaultParams = { ...m.parameters };
        if (m.category === 'DG / DA') defaultParams = { rpm: 1500, power: 150, frequency: 50, vibration: 1.0 };
        else if (m.category === 'HP Compressor') defaultParams = { pressure: 30, temperature: 45, vibration: 1.2 };
        else if (m.category === 'Main Engine') defaultParams = { rpm: 2100, power: 3000, temperature: 85, vibration: 1.5, vibrationHz: 25.5 };
        else if (m.category === 'Gear Box') defaultParams = { rpm: 2100, outputRpm: 800, speedRatio: 2.625, temperature: 65, vibration: 2.0 };
        else if (m.category === 'Waterjet Propeller') defaultParams = { rpm: 800, flowRate: 30, thrust: 250, vibration: 2.5 };

        return { ...m, healthScore: 100, alertLevel: 'normal', overspeed: false, parameters: defaultParams };
      }
      return m;
    });
  }

  public addManualLog(alertId: string, logMessage: string) {
    // Add human operator learning log to an alert
    this.alerts = this.alerts.map(a => a.id === alertId ? { ...a, recommendedAction: a.recommendedAction + ` [Operator Note: ${logMessage}]` } : a);
  }

  public tick() {
    this.machines = this.machines.map(m => {
      if (m.status === 'Stopped') return m;

      const newParams = { ...m.parameters };
      let newHealth = m.healthScore;
      let newAlertLevel = m.alertLevel;
      let newOverspeed = false;

      // Base random walk
      if (newParams.rpm !== undefined) newParams.rpm = randomWalk(newParams.rpm, 5);
      if (newParams.power !== undefined) newParams.power = randomWalk(newParams.power, 10);
      if (newParams.vibration !== undefined) newParams.vibration = randomWalk(newParams.vibration, 0.1);
      if (newParams.temperature !== undefined) newParams.temperature = randomWalk(newParams.temperature, 0.5);
      if (newParams.pressure !== undefined) newParams.pressure = randomWalk(newParams.pressure, 0.5);
      if (newParams.vibrationHz !== undefined) newParams.vibrationHz = randomWalk(newParams.vibrationHz, 0.2);
      if (newParams.flowRate !== undefined) newParams.flowRate = randomWalk(newParams.flowRate, 0.5);
      if (newParams.thrust !== undefined) newParams.thrust = randomWalk(newParams.thrust, 2);
      if (newParams.outputRpm !== undefined) newParams.outputRpm = randomWalk(newParams.outputRpm, 3);
      if (newParams.frequency !== undefined) newParams.frequency = randomWalk(newParams.frequency, 0.1);

      let newHistory = m.vibrationHistory ? [...m.vibrationHistory] : [];
      if (newParams.vibration !== undefined) {
        newHistory.push(newParams.vibration);
        if (newHistory.length > 20) newHistory.shift();
      }

      // Small natural recovery or fluctuation
      if (newAlertLevel === 'normal' && newHealth < 100) {
        newHealth = Math.min(100, newHealth + 1);
      }

      return {
        ...m,
        parameters: newParams,
        healthScore: newHealth,
        alertLevel: newAlertLevel,
        overspeed: newOverspeed,
        vibrationHistory: newHistory
      };
    });
  }

  public injectAnomaly(machineId: string, level: 'attention' | 'danger') {
    this.machines = this.machines.map(m => {
      if (m.id === machineId && m.status !== 'Stopped') {
        let newHealth = m.healthScore;
        let newAlertLevel = level;
        let newOverspeed = m.overspeed;
        const newParams = { ...m.parameters };

        if (level === 'attention') {
          newHealth = Math.floor(Math.random() * 20) + 70; // 70-89
          if (newParams.vibration !== undefined) newParams.vibration += 1.5; 
          
          if (m.category === 'Main Engine' && Math.random() < 0.5) {
            if (newParams.rpm) newParams.rpm += 200;
            newOverspeed = true;
            this.createAlert(m, 'attention', 'Overspeed detected. Governor response degrading.', 'Investigate speed governor and fuel actuators', '~50 hrs');
          } else {
            this.createAlert(m, 'attention', 'High torsional vibration pattern detected.', 'Plan alignment check at next harbour', '~100 hrs');
          }
        } else if (level === 'danger') {
          newHealth = Math.floor(Math.random() * 30) + 20; // 20-49
          if (newParams.temperature !== undefined) newParams.temperature += 20;
          if (newParams.vibration !== undefined) newParams.vibration += 3.0; 
          
          if (m.category === 'Gear Box') {
            this.createAlert(m, 'danger', 'Critical oil temp and lateral vibration spike. Imminent bearing failure.', 'Immediate shutdown and inspect thrust bearings.', '< 2 hrs');
          } else {
            this.createAlert(m, 'danger', 'Analysis indicates critical structural stress.', 'Immediate shutdown requested.', '< 5 hrs');
          }
        }

        return {
          ...m,
          healthScore: newHealth,
          alertLevel: newAlertLevel,
          parameters: newParams,
          overspeed: newOverspeed
        };
      }
      return m;
    });
  }

  public toggleMachineStatus(machineId: string) {
    this.machines = this.machines.map(m => {
      if (m.id === machineId) {
        if (m.status === 'Stopped') {
          // Start the machine, initialize with standard operational values
          let defaultParams = { ...m.parameters };
          if (m.category === 'DG / DA') defaultParams = { rpm: 1500, power: 150, frequency: 50, vibration: 1.0 };
          else if (m.category === 'HP Compressor') defaultParams = { pressure: 30, temperature: 45, vibration: 1.2 };
          else if (m.category === 'Main Engine') defaultParams = { rpm: 2100, power: 3000, temperature: 85, vibration: 1.5, vibrationHz: 25.5 };
          else if (m.category === 'Gear Box') defaultParams = { rpm: 2100, outputRpm: 800, speedRatio: 2.625, temperature: 65, vibration: 2.0 };
          else if (m.category === 'Waterjet Propeller') defaultParams = { rpm: 800, flowRate: 30, thrust: 250, vibration: 2.5 };
          
          return {
            ...m,
            status: 'Running',
            parameters: defaultParams,
            healthScore: 100,
            alertLevel: 'normal',
            overspeed: false
          };
        } else {
          // Stop it, reset values to zero-state
          const stoppedParams = { ...m.parameters };
          if (stoppedParams.rpm !== undefined) stoppedParams.rpm = 0;
          if (stoppedParams.power !== undefined) stoppedParams.power = 0;
          if (stoppedParams.pressure !== undefined) stoppedParams.pressure = 0;
          if (stoppedParams.flowRate !== undefined) stoppedParams.flowRate = 0;
          if (stoppedParams.vibration !== undefined) stoppedParams.vibration = 0;
          // Temperature slowly decreases but simulating instant drop to ambient for simplicity
          
          return {
            ...m,
            status: 'Stopped',
            parameters: stoppedParams,
            healthScore: 100,
            alertLevel: 'normal',
            overspeed: false
          };
        }
      }
      return m;
    });
  }

  private createAlert(machine: MachineState, level: 'attention' | 'danger', msg: string, action: string, life: string) {
    this.alerts.unshift({
      id: genId(),
      machineId: machine.id,
      machineName: machine.name,
      level,
      timestamp: new Date().toISOString(),
      message: msg,
      probableCause: msg, // Simplified simulation
      recommendedAction: action,
      remainingLife: life,
      resolved: false
    });
    // Keep max 50 alerts
    if (this.alerts.length > 50) this.alerts.pop();
  }
}
