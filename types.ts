export enum AppState {
  IDLE = 'IDLE',
  INSPECTING = 'INSPECTING',
  FIRING = 'FIRING',
  RELOADING = 'RELOADING'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface GunStats {
  ammo: number;
  capacity: number;
  condition: number;
}