export interface Chain {
  chainId: bigint;
  chainIdHex: string;
  name: string;
  explorerTx: string;
  explorerHome: string;
}

export interface TileInfo {
  emoji: string;
  name: string;
}

export interface Rule {
  id: number;
  name: string;
  payout: string;
  desc: string;
  test: (seed: string, counts: Record<string, number>) => boolean;
}

export interface PlayRecord {
  chainId: string;
  to: string;
  valueEth: string;
  txHash: string;
  blockNumber: string;
  seed10: string;
  rule: { id: number; name: string; payout: string } | null;
  timestamp: string;
}

export interface TaskProgress {
  playCount: number;
  winCount: number;
  totalExp: number;
}

export interface TaskPeriodState {
  date?: string;
  week?: string;
  completed: Record<string, boolean>;
  progress: TaskProgress;
}

export interface Tasks {
  daily: TaskPeriodState;
  weekly: TaskPeriodState;
}

export interface TaskDefinition {
  id: string;
  type: 'daily' | 'weekly';
  name: string;
  desc: string;
  reward: number;
  target: number;
}

export type StatusClass = 'ok' | 'no' | '';
