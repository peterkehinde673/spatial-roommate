import type { SpatialTask } from './tasks';
import { parseGoal } from './goal';

const taskTemplates: Array<Pick<SpatialTask, 'id' | 'title'>> = [
  { id: 'focus', title: 'Focus' },
  { id: 'build', title: 'Build' },
  { id: 'ship', title: 'Ship' },
];

export function planGoal(goal: string): SpatialTask[] {
  const intent = parseGoal(goal);
  const normalizedGoal = intent.focus;

  if (!normalizedGoal) {
    const prefixByCategory = {
    build: ['Focus', 'Build', 'Ship'],
    learn: ['Question', 'Practice', 'Recall'],
    plan: ['Define', 'Organize', 'Next step'],
    general: ['Focus', 'Build', 'Ship'],
  } as const;

  const prefixes = prefixByCategory[intent.category];

  return taskTemplates.map((task, index) => ({
      ...task,
      position: [-0.95 + index * 0.95, 1.38, -1.05],
      status: 'open',
    }));
  }

  return taskTemplates.map((task, index) => ({
    ...task,
    title:
      index === 0
        ? `${prefixes[0]}: ${normalizedGoal}`
        : index === 1
          ? `${prefixes[1]}: ${normalizedGoal}`
          : `${prefixes[2]}: ${normalizedGoal}`,
    position: [-0.95 + index * 0.95, 1.38, -1.05],
    status: 'open',
  }));
}
