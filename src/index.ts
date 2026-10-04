import {
  AmbientLight,
  BoxGeometry,
  Mesh,
  MeshStandardMaterial,
  RayInteractable,
  SphereGeometry,
  OneHandGrabbable,
  World,
} from '@iwsdk/core';
import projectOptions from 'virtual:iwsdk-project';
import { initialTasks } from './domain/tasks';

const container = document.querySelector<HTMLDivElement>('#scene-container');

if (!container) {
  throw new Error('Missing #scene-container');
}

const world = await World.create(container, projectOptions);
const root = world.getPersistentRoot();

const desk = new Mesh(
  new BoxGeometry(3.2, 0.12, 2.0),
  new MeshStandardMaterial({ color: 0x243047 }),
);
desk.position.set(0, 1.0, -1.0);
root.add(desk);

const companion = new Mesh(
  new SphereGeometry(0.22, 24, 16),
  new MeshStandardMaterial({ color: 0x7dd3fc, emissive: 0x164e63 }),
);
companion.position.set(0, 1.55, -1.0);
root.add(companion);

const light = new AmbientLight(0xffffff, 2);
root.add(light);

const taskMaterial = new MeshStandardMaterial({ color: 0x334155 });
const completeMaterial = new MeshStandardMaterial({
  color: 0x22c55e,
  emissive: 0x14532d,
});

for (const task of initialTasks) {
  const card = new Mesh(
    new BoxGeometry(0.72, 0.42, 0.12),
    taskMaterial.clone(),
  );
  card.position.set(...task.position);

  const entity = world.createTransformEntity(card);
  entity.addComponent(RayInteractable);
  entity.addComponent(OneHandGrabbable, {
    translate: true,
    rotate: false,
  });

  card.addEventListener('pointerdown', () => {
    task.status = task.status === 'open' ? 'complete' : 'open';
    card.material = task.status === 'complete'
      ? completeMaterial.clone()
      : taskMaterial.clone();

    const completed = initialTasks.filter((item) => item.status === 'complete').length;
    console.log(
      `Task "${task.title}" is now ${task.status}. Progress: ${completed}/${initialTasks.length}`,
    );

    if (completed === initialTasks.length) {
      companion.scale.setScalar(1.35);
      console.log('Spatial Roommate: all tasks complete');
    } else {
      companion.scale.setScalar(1);
    }
  });
}

console.log('Spatial Roommate interaction loop ready', world);
