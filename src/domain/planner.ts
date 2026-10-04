import type { SpatialTask } from './tasks';
import { parseGoal } from './goal';

const taskTemplates: Array<Pick<SpatialTask, 'id' | 'title'>> = [
  { id: 'focus', title: 'Focus' },
  { id: 'build', title: 'Build' },
  { id: 'ship', title: 'Ship' },
];

const prefixByCategory = {
  build: ['Focus', 'Build', 'Ship'],
  learn: ['Question', 'Practice', 'Recall'],
  plan: ['Define', 'Organize', 'Next step'],
  general: ['Focus', 'Build', 'Ship'],
} as const;

export function planGoal(goal: string): SpatialTask[] {
  const intent = parseGoal(goal);
  const normalizedGoal = intent.focus;
  const prefixes = prefixByCategory[intent.category];

  return taskTemplates.map((task, index) => ({
    ...task,
    title:
      normalizedGoal
        ? `${prefixes[index]}: ${normalizedGoal}`
        : prefixes[index],
    position: [-0.95 + index * 0.95, 1.38, -1.05],
    status: 'open',
  }));
}
