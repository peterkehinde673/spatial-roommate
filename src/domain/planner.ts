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
        ? `Focus: ${normalizedGoal}`
        : index === 1
          ? `Build: ${normalizedGoal}`
          : `Ship: ${normalizedGoal}`,
    position: [-0.95 + index * 0.95, 1.38, -1.05],
    status: 'open',
  }));
}
