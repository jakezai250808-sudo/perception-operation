import * as THREE from 'three';
import type { OverlayRig } from './types';

export function createRedundancyRig(): OverlayRig {
  const root = new THREE.Group();

  const shellMaterial = new THREE.MeshStandardMaterial({
    color: '#21c19a',
    metalness: 0.35,
    roughness: 0.3,
    emissive: '#1ea88b',
    emissiveIntensity: 0,
    transparent: true
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.18), shellMaterial);

  const fins = new THREE.Group();
  for (let i = 0; i < 4; i += 1) {
    const fin = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.01, 0.02),
      new THREE.MeshStandardMaterial({ color: '#8df4de', emissive: '#49eec9', emissiveIntensity: 0.15 })
    );
    fin.position.set(0, -0.05 + i * 0.03, 0.09);
    fins.add(fin);
  }

  root.add(body);
  root.add(fins);

  return {
    root,
    animatedMaterials: [shellMaterial],
    pulseMaterial: shellMaterial
  };
}
