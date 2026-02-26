import { Tasks, TaskDefinition, TaskPeriodState } from './types';

export const TASK_LIST: TaskDefinition[] = [
  { id: 'daily_play_1',   type: 'daily',   name: 'Play 1 Game',    desc: 'Play 1 game today',              reward: 10,  target: 1   },
  { id: 'daily_play_5',   type: 'daily',   name: 'Play 5 Games',   desc: 'Play 5 games today',             reward: 50,  target: 5   },
  { id: 'daily_win_1',    type: 'daily',   name: 'Win 1 Game',     desc: 'Win at least 1 game today',      reward: 30,  target: 1   },
  { id: 'daily_exp_100',  type: 'daily',   name: 'Earn 100 EXP',   desc: 'Earn 100 EXP today',             reward: 20,  target: 100 },
  { id: 'weekly_play_20', type: 'weekly',  name: 'Play 20 Games',  desc: 'Play 20 games this week',        reward: 200, target: 20  },
  { id: 'weekly_win_5',   type: 'weekly',  name: 'Win 5 Games',    desc: 'Win at least 5 games this week', reward: 150, target: 5   },
  { id: 'weekly_exp_500', type: 'weekly',  name: 'Earn 500 EXP',   desc: 'Earn 500 EXP this week',        reward: 100, target: 500 },
];

export const EXP_REWARD_MAP: Record<number, number> = {
  1: 5000,
  2: 2000,
  3: 800,
  4: 400,
  5: 200,
  6: 100,
  7: 300,
  8: 250,
  9: 180,
  10: 80,
  11: 60,
  12: 40,
  13: 50,
  14: 25,
  15: 45,
  16: 70,
  17: 90,
  18: 75,
};

export function getExpReward(ruleId: number | null): number {
  if (ruleId === null) return 5;
  return EXP_REWARD_MAP[ruleId] || 5;
}

export function getTotalExpForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level <= 10) {
    return Math.floor(50 * level * (level - 1) / 2);
  } else if (level <= 30) {
    const base = getTotalExpForLevel(10);
    let sum = base;
    for (let i = 11; i <= level; i++) {
      sum += Math.floor(100 + (i - 10) * 20 + Math.pow(i - 10, 1.4) * 5);
    }
    return sum;
  } else if (level <= 60) {
    const base = getTotalExpForLevel(30);
    let sum = base;
    for (let i = 31; i <= level; i++) {
      sum += Math.floor(300 + (i - 30) * 30 + Math.pow(i - 30, 1.5) * 8);
    }
    return sum;
  } else if (level <= 90) {
    const base = getTotalExpForLevel(60);
    let sum = base;
    for (let i = 61; i <= level; i++) {
      sum += Math.floor(800 + (i - 60) * 50 + Math.pow(i - 60, 1.6) * 15);
    }
    return sum;
  } else {
    const base = getTotalExpForLevel(90);
    let sum = base;
    for (let i = 91; i <= level; i++) {
      sum += Math.floor(2000 + (i - 90) * 100 + Math.pow(i - 90, 1.7) * 30);
    }
    return sum;
  }
}

export function getLevelFromExp(totalExp: number): number {
  for (let level = 1; level <= 100; level++) {
    if (totalExp < getTotalExpForLevel(level + 1)) return level;
  }
  return 100;
}

export function getTodayKey(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

export function getWeekKey(): string {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const pastDaysOfYear = (today.getTime() - startOfYear.getTime()) / 86400000;
  const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  return `${today.getFullYear()}-W${weekNumber}`;
}

export function initTasks(tasks: Partial<Tasks>): Tasks {
  const todayKey = getTodayKey();
  const weekKey = getWeekKey();

  const defaultPeriod = (): TaskPeriodState => ({
    completed: {},
    progress: { playCount: 0, winCount: 0, totalExp: 0 },
  });

  const daily: TaskPeriodState =
    tasks.daily && tasks.daily.date === todayKey
      ? tasks.daily
      : { ...defaultPeriod(), date: todayKey };

  const weekly: TaskPeriodState =
    tasks.weekly && tasks.weekly.week === weekKey
      ? tasks.weekly
      : { ...defaultPeriod(), week: weekKey };

  return { daily, weekly };
}

export function getTaskCurrent(taskId: string, tasks: Tasks): number {
  const daily = tasks.daily.progress;
  const weekly = tasks.weekly.progress;
  switch (taskId) {
    case 'daily_play_1':
    case 'daily_play_5':  return daily.playCount;
    case 'daily_win_1':   return daily.winCount;
    case 'daily_exp_100': return daily.totalExp;
    case 'weekly_play_20': return weekly.playCount;
    case 'weekly_win_5':   return weekly.winCount;
    case 'weekly_exp_500': return weekly.totalExp;
    default: return 0;
  }
}
