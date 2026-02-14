import * as THREE from 'three';

export interface OverlayRig {
  root: THREE.Group;
  animatedMaterials: Array<THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial>;
  pulseMaterial?: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;
  spinner?: THREE.Object3D;
  blinker?: THREE.Object3D;
}
