import type { SpatialTask } from './tasks';

export type CompanionMood = 'ready' | 'encouraging' | 'celebrating';

export interface CompanionState {
  message: string;
  mood: CompanionMood;
  completed: number;
  total: number;
}

export function getCompanionState(tasks: SpatialTask[]): CompanionState {
  const completed = tasks.filter((task) => task.status === 'complete').length;
  const total = tasks.length;

  if (completed === total && total > 0) {
    return {
      message: 'Nice work. The room is ready for what comes next.',
      mood: 'celebrating',
      completed,
      total,
    };
  }

  if (completed > 0) {
    const nextTask = tasks.find((task) => task.status === 'open');
    return {
      message: nextTask
        ? `Good progress. Try ${nextTask.title} next.`
        : 'Good progress. Keep going.',
      mood: 'encouraging',
      completed,
      total,
    };
  }

  return {
    message: 'Pick a task and bring it into focus.',
    mood: 'ready',
    completed,
    total,
  };
}
