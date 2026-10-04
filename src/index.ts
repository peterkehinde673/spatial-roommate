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
import { getCompanionState } from './domain/companion';
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

const companionMaterial = new MeshStandardMaterial({
  color: 0x7dd3fc,
  emissive: 0x164e63,
});

const companion = new Mesh(
  new SphereGeometry(0.22, 24, 16),
  companionMaterial,
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

function updateCompanion(): void {
  const state = getCompanionState(initialTasks);

  companion.scale.setScalar(state.mood === 'celebrating' ? 1.35 : state.mood === 'encouraging' ? 1.15 : 1);

  if (state.mood === 'celebrating') {
    companionMaterial.color.setHex(0x4ade80);
    companionMaterial.emissive.setHex(0x166534);
  } else if (state.mood === 'encouraging') {
    companionMaterial.color.setHex(0xfacc15);
    companionMaterial.emissive.setHex(0x713f12);
  } else {
    companionMaterial.color.setHex(0x7dd3fc);
    companionMaterial.emissive.setHex(0x164e63);
  }

  console.log(
    `Roommate [${state.mood}] ${state.message} Progress: ${state.completed}/${state.total}`,
  );
}

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

    updateCompanion();
  });
}

updateCompanion();
console.log('Spatial Roommate companion reasoning ready', world);
