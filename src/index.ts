import {
  AmbientLight,
  BoxGeometry,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  World,
} from '@iwsdk/core';
import projectOptions from 'virtual:iwsdk-project';

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

console.log('Spatial Roommate foundation ready', world);
