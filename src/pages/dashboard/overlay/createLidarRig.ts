import * as THREE from 'three';
import type { OverlayRig } from './types';

export function createLidarRig(): OverlayRig {
  const root = new THREE.Group();

  const baseMaterial = new THREE.MeshStandardMaterial({
    color: '#a74cff',
    metalness: 0.6,
    roughness: 0.25,
    emissive: '#8b2dff',
    emissiveIntensity: 0,
    transparent: true
  });

  const ringMaterial = new THREE.MeshStandardMaterial({
    color: '#e3a8ff',
    emissive: '#e64aff',
    emissiveIntensity: 0,
    transparent: true
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 22), baseMaterial);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.015, 10, 28), ringMaterial);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.03;

  root.add(base);
  root.add(ring);

  return {
    root,
    animatedMaterials: [baseMaterial, ringMaterial],
    pulseMaterial: ringMaterial,
    spinner: ring
  };
}
