export type MachineCategory =
  | 'Main Engine'
  | 'DG / DA'
  | 'Gear Box'
  | 'Waterjet Propeller'
  | 'HP Compressor';

export type AlertLevel = 'normal' | 'attention' | 'danger';
export type MachineStatus = 'Running' | 'Stopped';

export interface MachineParameters {
  rpm?: number;
  power?: number; // kW
  vibration?: number; // mm/s
  vibrationHz?: number; // Hz (Main Engine)
  temperature?: number; // Celsius
  pressure?: number; // Bar
  flowRate?: number; // m3/hr
  thrust?: number; // kN (Waterjet)
  outputRpm?: number; // RPM (Gear Box)
  speedRatio?: number; // Ratio (Gear Box)
  frequency?: number; // Hz (DG / DA)
}

export interface MachineState {
  id: string;
  name: string;
  category: MachineCategory;
  status: MachineStatus;
  healthScore: number; // 0 to 100
  alertLevel: AlertLevel;
  overspeed: boolean;
  parameters: MachineParameters;
  vibrationHistory?: number[];
}

export interface AlertRecord {
  id: string;
  machineId: string;
  machineName: string;
  level: 'attention' | 'danger';
  timestamp: string; // ISO string
  message: string;
  probableCause: string;
  recommendedAction: string;
  remainingLife: string;
  resolved: boolean;
}

export interface SystemData {
  machines: MachineState[];
  alerts: AlertRecord[];
}
