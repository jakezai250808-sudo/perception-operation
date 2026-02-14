import * as THREE from 'three';
import type { OverlayRig } from './types';

export function createCameraRig(): OverlayRig {
  const root = new THREE.Group();

  const bodyMaterial = new THREE.MeshStandardMaterial({ color: '#2f76ff', metalness: 0.35, roughness: 0.35, transparent: true });
  const lensMaterial = new THREE.MeshPhysicalMaterial({
    color: '#8ed7ff',
    roughness: 0.08,
    metalness: 0.2,
    transmission: 0.5,
    emissive: '#3562ff',
    emissiveIntensity: 0
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.14), bodyMaterial);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 16), lensMaterial);
  lens.rotation.z = Math.PI / 2;
  lens.position.x = 0.13;

  root.add(body);
  root.add(lens);

  return {
    root,
    animatedMaterials: [bodyMaterial, lensMaterial],
    pulseMaterial: lensMaterial,
    blinker: lens
  };
}
