<template>
  <div style="position: relative; height: calc(100vh - 250px)">
    <div ref="container" style="width: 100%; height: 100%"></div>
    <div style="position:absolute;right:12px;top:12px" class="panel">
      <div style="padding:8px 10px;font-size:12px">P0:red / P1:orange / P2:yellow / P3:cyan</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { GeoEvent } from '@/types';

const props = defineProps<{
  polylines: Array<Array<[number, number]>>;
  basemapUrl?: string;
  events: GeoEvent[];
  selectedId?: string;
  clusterOn: boolean;
}>();
const emit = defineEmits<{ select: [GeoEvent]; camera: [number, number, number] }>();

const container = ref<HTMLDivElement | null>(null);
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let eventMeshes: THREE.Mesh[] = [];
let mapObjects: THREE.Object3D[] = [];
let basemapPlane: THREE.Mesh | null = null;
let animation = 0;

const severityColor: Record<string, number> = { P0: 0xff3b30, P1: 0xff9500, P2: 0xffcc00, P3: 0x32d7ff };

const drawBasemap = () => {
  if (!scene) return;
  if (basemapPlane) {
    scene.remove(basemapPlane);
    basemapPlane.geometry.dispose();
    (basemapPlane.material as THREE.Material).dispose();
    basemapPlane = null;
  }
  if (!props.basemapUrl) return;

  const loader = new THREE.TextureLoader();
  loader.load(props.basemapUrl, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.5 });
    const geometry = new THREE.PlaneGeometry(1200, 800);
    basemapPlane = new THREE.Mesh(geometry, material);
    basemapPlane.position.set(0, 0, -1);
    scene.add(basemapPlane);
  });
};

const drawMap = () => {
  mapObjects.forEach((o) => scene.remove(o));
  mapObjects = [];
  props.polylines.forEach((line) => {
    const points = line.map(([x, y]) => new THREE.Vector3(x, y, 0));
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0x7ea0ff, transparent: true, opacity: 0.75 });
    const mesh = new THREE.Line(geometry, material);
    scene.add(mesh);
    mapObjects.push(mesh);
  });
};

function buildCluster(events: GeoEvent[]): GeoEvent[] {
  if (!props.clusterOn) return events;
  const cell = 40;
  const m = new Map<string, GeoEvent>();
  events.forEach((e) => {
    const key = `${Math.floor(e.position.world.x / cell)}_${Math.floor(e.position.world.y / cell)}_${e.severity}`;
    if (!m.has(key)) m.set(key, { ...e, message: `[cluster] ${e.message}` });
  });
  return [...m.values()];
}

const drawEvents = () => {
  eventMeshes.forEach((m) => scene.remove(m));
  eventMeshes = [];
  buildCluster(props.events).forEach((e) => {
    const size = e.severity === 'P0' ? 5 : e.severity === 'P1' ? 4 : e.severity === 'P2' ? 3 : 2.4;
    const g = new THREE.SphereGeometry(size, 16, 16);
    const m = new THREE.MeshBasicMaterial({ color: severityColor[e.severity], transparent: true, opacity: 0.9 });
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(e.position.world.x, e.position.world.y, 2);
    mesh.userData = { event: e };
    scene.add(mesh);
    eventMeshes.push(mesh);
  });
};

const onClick = (evt: MouseEvent) => {
  if (!container.value) return;
  const rect = container.value.getBoundingClientRect();
  const mouse = new THREE.Vector2(((evt.clientX - rect.left) / rect.width) * 2 - 1, -((evt.clientY - rect.top) / rect.height) * 2 + 1);
  const ray = new THREE.Raycaster();
  ray.setFromCamera(mouse, camera);
  const hit = ray.intersectObjects(eventMeshes)[0];
  if (hit?.object?.userData?.event) emit('select', hit.object.userData.event as GeoEvent);
};

onMounted(() => {
  if (!container.value) return;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(55, container.value.clientWidth / container.value.clientHeight, 1, 5000);
  camera.position.set(0, -350, 340);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.value.clientWidth, container.value.clientHeight);
  renderer.setClearColor(0x0b1220);
  container.value.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.addEventListener('change', () => emit('camera', camera.position.x, camera.position.y, camera.position.z));

  scene.add(new THREE.GridHelper(1000, 25, 0x334155, 0x1e293b));

  container.value.addEventListener('click', onClick);

  const run = () => {
    controls.update();
    renderer.render(scene, camera);
    animation = requestAnimationFrame(run);
  };

  drawBasemap();
  drawMap();
  drawEvents();
  run();
});

watch(() => props.basemapUrl, drawBasemap);
watch(() => props.polylines, drawMap, { deep: true });
watch(() => [props.events, props.clusterOn], drawEvents, { deep: true });
watch(
  () => props.selectedId,
  () => {
    const event = props.events.find((e) => e.id === props.selectedId);
    if (!event) return;
    controls.target.set(event.position.world.x, event.position.world.y, 0);
    camera.position.set(event.position.world.x, event.position.world.y - 120, 120);
  }
);

onBeforeUnmount(() => {
  cancelAnimationFrame(animation);
  if (container.value) container.value.removeEventListener('click', onClick);
  controls?.dispose();
  renderer?.dispose();
});
</script>
