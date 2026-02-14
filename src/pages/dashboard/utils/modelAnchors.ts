import * as THREE from 'three';

export type AnchorKey =
  | 'roof_front'
  | 'roof_center'
  | 'bumper_front'
  | 'bumper_rear'
  | 'dump_body_left'
  | 'dump_body_right'
  | 'cab_left'
  | 'cab_right';

export type AnchorsMap = Record<AnchorKey, THREE.Vector3>;

export function inferAnchors(target: THREE.Object3D): AnchorsMap {
  const box = new THREE.Box3().setFromObject(target);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const minX = center.x - size.x / 2;
  const maxX = center.x + size.x / 2;
  const minY = center.y - size.y / 2;
  const maxY = center.y + size.y / 2;
  const minZ = center.z - size.z / 2;
  const maxZ = center.z + size.z / 2;

  const x = (ratio: number) => minX + size.x * ratio;
  const y = (ratio: number) => minY + size.y * ratio;
  const z = (ratio: number) => minZ + size.z * ratio;

  return {
    roof_front: new THREE.Vector3(x(0.62), y(0.9), center.z),
    roof_center: new THREE.Vector3(x(0.5), y(0.88), center.z),
    bumper_front: new THREE.Vector3(maxX + size.x * 0.02, y(0.4), center.z),
    bumper_rear: new THREE.Vector3(minX - size.x * 0.02, y(0.36), center.z),
    dump_body_left: new THREE.Vector3(x(0.28), y(0.6), maxZ + size.z * 0.08),
    dump_body_right: new THREE.Vector3(x(0.28), y(0.6), minZ - size.z * 0.08),
    cab_left: new THREE.Vector3(x(0.66), y(0.66), maxZ + size.z * 0.08),
    cab_right: new THREE.Vector3(x(0.66), y(0.66), minZ - size.z * 0.08)
  };
}

export function createAnchorDebugObjects(anchors: AnchorsMap): THREE.Object3D[] {
  return Object.entries(anchors).map(([key, position]) => {
    const root = new THREE.Group();
    root.position.copy(position);

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 10, 10),
      new THREE.MeshStandardMaterial({ color: '#5fd5ff', emissive: '#2f8dff', emissiveIntensity: 0.8 })
    );

    const axis = new THREE.AxesHelper(0.35);
    sphere.name = `anchor-${key}`;
    root.add(sphere);
    root.add(axis);
    return root;
  });
}
