import type { SpatialTask } from './tasks';

export interface SessionSummary {
  completed: number;
  total: number;
  remaining: number;
  nextTask: string | null;
  finished: boolean;
  progress: number;
}

export function summarizeSession(tasks: SpatialTask[]): SessionSummary {
  const completed = tasks.filter((task) => task.status === 'complete').length;
  const total = tasks.length;
  const remaining = total - completed;
  const nextTask = tasks.find((task) => task.status === 'open')?.title ?? null;
  const progress = total > 0 ? completed / total : 0;

  return {
    completed,
    total,
    remaining,
    nextTask,
    finished: total > 0 && remaining === 0,
    progress,
  };
}
