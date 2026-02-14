import * as THREE from 'three';
import type { OverlayRig } from './types';

export function createRadarRig(): OverlayRig {
  const root = new THREE.Group();

  const shellMaterial = new THREE.MeshStandardMaterial({
    color: '#f7aa38',
    metalness: 0.5,
    roughness: 0.3,
    emissive: '#ff8f1a',
    emissiveIntensity: 0,
    transparent: true
  });

  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.11, 0.2), shellMaterial);
  const line = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.01, 0.2),
    new THREE.MeshStandardMaterial({ color: '#ffe0a4', emissive: '#ffb347', emissiveIntensity: 0.3 })
  );
  line.position.y = 0.04;

  root.add(plate);
  root.add(line);

  return {
    root,
    animatedMaterials: [shellMaterial],
    pulseMaterial: shellMaterial
  };
}
