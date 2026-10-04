export type TaskStatus = 'open' | 'complete';

export interface SpatialTask {
  id: string;
  title: string;
  position: [number, number, number];
  status: TaskStatus;
}

export const initialTasks: SpatialTask[] = [
  {
    id: 'focus',
    title: 'Focus',
    position: [-0.95, 1.38, -1.05],
    status: 'open',
  },
  {
    id: 'build',
    title: 'Build',
    position: [0, 1.38, -1.05],
    status: 'open',
  },
  {
    id: 'ship',
    title: 'Ship',
    position: [0.95, 1.38, -1.05],
    status: 'open',
  },
];
