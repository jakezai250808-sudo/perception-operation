<template>
  <div class="viewer-shell">
    <div v-if="renderMode === 'model'" ref="canvasEl" class="canvas-host" />

    <div
      v-else
      class="frames-host"
      @mousedown="onDragStart"
      @mousemove="onDragMove"
      @mouseup="onDragEnd"
      @mouseleave="onDragEnd"
      @touchstart.passive="onTouchStart"
      @touchmove.passive="onTouchMove"
      @touchend="onDragEnd"
    >
      <img class="frame-image" :src="currentFrameSrc" alt="dump truck 360" />
    </div>

    <SensorOverlayManager
      :mode="renderMode === 'model' ? 'model' : 'frames'"
      :active-types="props.activeTypes"
      :anchors2d="currentAnchors2d"
      :debug-anchors="debugAnchors"
    />

    <div v-if="loading" class="overlay loading">模型加载中 {{ progress }}%</div>
    <div v-else-if="error" class="overlay error">{{ error }}</div>
    <div v-if="renderMode === 'frames'" class="overlay mode">360 帧回退模式（拖拽旋转）</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createCameraRig } from '../overlay/createCameraRig';
import { createLidarRig } from '../overlay/createLidarRig';
import { createRadarRig } from '../overlay/createRadarRig';
import { createRedundancyRig } from '../overlay/createRedundancyRig';
import type { OverlayRig } from '../overlay/types';
import { createAnchorDebugObjects, inferAnchors, type AnchorKey, type AnchorsMap } from '../utils/modelAnchors';
import { easeOutBack, tween } from '../utils/anim';
import SensorOverlayManager from './SensorOverlayManager.vue';

type OverlayType = 'camera' | 'radar' | 'lidar' | 'redundancy';

type RenderMode = 'model' | 'frames';

const props = defineProps<{
  modelUrl: string;
  activeTypes: OverlayType[];
}>();

const canvasEl = ref<HTMLDivElement | null>(null);
const loading = ref(true);
const error = ref('');
const progress = ref(0);
const renderMode = ref<RenderMode>('model');

const route = useRoute();
const debugAnchors = String(route.query.debugAnchors ?? '') === '1';

const frameCount = 36;
const currentFrame = ref(0);
const dragStartX = ref(0);
const dragStartFrame = ref(0);
const dragging = ref(false);
const frameUrls = Array.from({ length: frameCount }).map((_, i) => `/assets/dumptruck360/frame_${String(i).padStart(2, '0')}.svg`);

const keyAnchorsByFrame: Record<number, Record<string, { x: number; y: number }>> = {
  0: { roof_center: { x: 52, y: 25 }, roof_front: { x: 58, y: 29 }, bumper_front: { x: 69, y: 45 }, bumper_rear: { x: 28, y: 47 }, dump_body_left: { x: 45, y: 39 }, dump_body_right: { x: 38, y: 43 } },
  6: { roof_center: { x: 50, y: 24 }, roof_front: { x: 57, y: 28 }, bumper_front: { x: 65, y: 44 }, bumper_rear: { x: 31, y: 47 }, dump_body_left: { x: 44, y: 39 }, dump_body_right: { x: 38, y: 43 } },
  12: { roof_center: { x: 49, y: 23 }, roof_front: { x: 53, y: 27 }, bumper_front: { x: 60, y: 44 }, bumper_rear: { x: 36, y: 46 }, dump_body_left: { x: 44, y: 39 }, dump_body_right: { x: 41, y: 43 } },
  18: { roof_center: { x: 48, y: 23 }, roof_front: { x: 47, y: 26 }, bumper_front: { x: 50, y: 45 }, bumper_rear: { x: 46, y: 45 }, dump_body_left: { x: 45, y: 38 }, dump_body_right: { x: 45, y: 43 } },
  24: { roof_center: { x: 48, y: 24 }, roof_front: { x: 42, y: 28 }, bumper_front: { x: 39, y: 46 }, bumper_rear: { x: 59, y: 44 }, dump_body_left: { x: 54, y: 39 }, dump_body_right: { x: 50, y: 43 } },
  30: { roof_center: { x: 50, y: 24 }, roof_front: { x: 45, y: 29 }, bumper_front: { x: 35, y: 46 }, bumper_rear: { x: 65, y: 44 }, dump_body_left: { x: 58, y: 40 }, dump_body_right: { x: 53, y: 44 } }
};

const currentFrameSrc = computed(() => frameUrls[currentFrame.value]);

const findBounds = (f: number) => {
  const keys = Object.keys(keyAnchorsByFrame).map(Number).sort((a, b) => a - b);
  let left = keys[0];
  let right = keys[keys.length - 1];
  for (let i = 0; i < keys.length; i += 1) {
    if (keys[i] <= f) left = keys[i];
    if (keys[i] >= f) {
      right = keys[i];
      break;
    }
  }
  return { left, right };
};

const currentAnchors2d = computed(() => {
  const { left, right } = findBounds(currentFrame.value);
  if (left === right) return keyAnchorsByFrame[left];
  const t = (currentFrame.value - left) / (right - left);
  const ret: Record<string, { x: number; y: number }> = {};
  Object.keys(keyAnchorsByFrame[left]).forEach((k) => {
    const p1 = keyAnchorsByFrame[left][k];
    const p2 = keyAnchorsByFrame[right][k] ?? p1;
    ret[k] = { x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t };
  });
  return ret;
});

const onDragStart = (e: MouseEvent) => {
  dragging.value = true;
  dragStartX.value = e.clientX;
  dragStartFrame.value = currentFrame.value;
};

const onDragMove = (e: MouseEvent) => {
  if (!dragging.value) return;
  const delta = e.clientX - dragStartX.value;
  const step = Math.floor(delta / 12);
  currentFrame.value = (dragStartFrame.value - step + frameCount * 10) % frameCount;
};

const onDragEnd = () => {
  dragging.value = false;
};

const onTouchStart = (e: TouchEvent) => {
  const t = e.touches[0];
  if (!t) return;
  dragging.value = true;
  dragStartX.value = t.clientX;
  dragStartFrame.value = currentFrame.value;
};

const onTouchMove = (e: TouchEvent) => {
  if (!dragging.value) return;
  const t = e.touches[0];
  if (!t) return;
  const delta = t.clientX - dragStartX.value;
  const step = Math.floor(delta / 12);
  currentFrame.value = (dragStartFrame.value - step + frameCount * 10) % frameCount;
};

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let controls: OrbitControls | null = null;
let frameId = 0;
let resizeObserver: ResizeObserver | null = null;
let overlayLayer: THREE.Group | null = null;
let anchors: AnchorsMap | null = null;
const activeRigMap = new Map<OverlayType, OverlayRig[]>();

const overlayAnchorMap: Record<OverlayType, AnchorKey[]> = {
  camera: ['roof_front', 'cab_left', 'cab_right', 'bumper_rear'],
  radar: ['bumper_front', 'bumper_rear'],
  lidar: ['roof_center'],
  redundancy: ['roof_front', 'dump_body_right']
};

const createRigByType = (type: OverlayType): OverlayRig => {
  if (type === 'camera') return createCameraRig();
  if (type === 'radar') return createRadarRig();
  if (type === 'lidar') return createLidarRig();
  return createRedundancyRig();
};

const animateIn = (rig: OverlayRig) => {
  rig.root.scale.setScalar(0.2);
  rig.root.position.y += 0.35;
  rig.animatedMaterials.forEach((mat) => {
    mat.transparent = true;
    mat.opacity = 0;
    mat.emissiveIntensity = 0;
  });
  const baseY = rig.root.position.y;
  tween({
    from: 0,
    to: 1,
    duration: 600,
    easing: easeOutBack,
    onUpdate: (v) => {
      rig.root.scale.setScalar(0.2 + v * 0.8);
      rig.root.position.y = baseY - (1 - v) * 0.35;
      rig.animatedMaterials.forEach((mat) => (mat.opacity = v));
    }
  });
  tween({ from: 0, to: 1.5, duration: 220, onUpdate: (v) => rig.pulseMaterial && (rig.pulseMaterial.emissiveIntensity = v), onComplete: () => tween({ from: 1.5, to: 0.6, duration: 220, onUpdate: (v) => rig.pulseMaterial && (rig.pulseMaterial.emissiveIntensity = v) }) });
};

const animateOut = (rig: OverlayRig, done: () => void) => {
  tween({
    from: 1,
    to: 0,
    duration: 280,
    onUpdate: (v) => {
      rig.root.scale.setScalar(0.85 + v * 0.15);
      rig.animatedMaterials.forEach((mat) => (mat.opacity = v));
    },
    onComplete: done
  });
};

const addTypeOverlays = (type: OverlayType) => {
  if (!anchors || !overlayLayer) return;
  const rigs = (overlayAnchorMap[type] ?? []).map((a) => {
    const rig = createRigByType(type);
    rig.root.position.copy(anchors![a]);
    overlayLayer!.add(rig.root);
    animateIn(rig);
    return rig;
  });
  activeRigMap.set(type, rigs);
};

const removeTypeOverlays = (type: OverlayType) => {
  const rigs = activeRigMap.get(type) ?? [];
  rigs.forEach((rig) => animateOut(rig, () => overlayLayer?.remove(rig.root)));
  activeRigMap.delete(type);
};

const syncOverlays = (types: OverlayType[]) => {
  const current = new Set(activeRigMap.keys());
  const target = new Set(types);
  current.forEach((t) => !target.has(t) && removeTypeOverlays(t));
  target.forEach((t) => !current.has(t) && addTypeOverlays(t));
};

const preloadFrames = () => {
  frameUrls.forEach((url) => {
    const img = new Image();
    img.src = url;
  });
};

const renderLoop = () => {
  frameId = requestAnimationFrame(renderLoop);
  const now = performance.now() * 0.001;
  activeRigMap.forEach((rigs, type) => {
    rigs.forEach((rig) => {
      if (type === 'lidar' && rig.spinner) rig.spinner.rotation.z += 0.04;
      if (type === 'camera' && rig.pulseMaterial) rig.pulseMaterial.emissiveIntensity = 0.35 + Math.sin(now * 2) * 0.14;
    });
  });
  controls?.update();
  if (scene && camera) renderer?.render(scene, camera);
};

const init3D = () => {
  if (!canvasEl.value) return;
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#060c18');
  camera = new THREE.PerspectiveCamera(48, 1, 0.1, 200);
  camera.position.set(6, 3, 6);
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  canvasEl.value.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 1.2, 0);

  scene.add(new THREE.HemisphereLight('#8fb8ff', '#263142', 1.1));
  const key = new THREE.DirectionalLight('#d8ebff', 1.2);
  key.position.set(8, 12, 4);
  scene.add(key);

  const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 64), new THREE.MeshStandardMaterial({ color: '#132238', roughness: 0.3, metalness: 0.2 }));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  overlayLayer = new THREE.Group();
  scene.add(overlayLayer);

  const loader = new GLTFLoader();
  loader.load(
    props.modelUrl,
    (gltf) => {
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      const size = box.getSize(new THREE.Vector3());
      model.scale.setScalar(4 / Math.max(size.x, size.y, size.z));
      scene?.add(model);
      anchors = inferAnchors(model);
      if (debugAnchors) createAnchorDebugObjects(anchors).forEach((obj) => overlayLayer?.add(obj));
      loading.value = false;
      syncOverlays(props.activeTypes);
    },
    (evt) => {
      if (evt.total) progress.value = Math.round((evt.loaded / evt.total) * 100);
    },
    () => {
      renderMode.value = 'frames';
      error.value = '3D 模型不可用，已自动切换到 360 帧模式';
      loading.value = false;
      preloadFrames();
    }
  );

  resizeObserver = new ResizeObserver((entries) => {
    const b = entries[0]?.contentRect;
    if (!b || !camera || !renderer) return;
    camera.aspect = b.width / b.height;
    camera.updateProjectionMatrix();
    renderer.setSize(b.width, b.height);
  });
  resizeObserver.observe(canvasEl.value);

  renderLoop();
};

onMounted(() => {
  init3D();
  preloadFrames();
});

watch(
  () => props.activeTypes,
  (types) => {
    if (renderMode.value === 'model' && !loading.value) syncOverlays(types);
  },
  { deep: true }
);

onBeforeUnmount(() => {
  cancelAnimationFrame(frameId);
  controls?.dispose();
  resizeObserver?.disconnect();
  renderer?.dispose();
});
</script>

<style scoped>
.viewer-shell { position: relative; height: 430px; border-radius: 16px; overflow: hidden; border: 1px solid rgba(95,155,255,.35); background: radial-gradient(circle at 20% 18%, rgba(62,135,255,.22), rgba(5,11,24,.96)); }
.canvas-host,.frames-host { width: 100%; height: 100%; }
.frames-host { position: relative; cursor: ew-resize; user-select: none; }
.frame-image { width: 100%; height: 100%; object-fit: cover; }
.overlay { position: absolute; left: 12px; right: 12px; padding: 8px 10px; border-radius: 10px; font-size: 13px; }
.overlay.loading { bottom: 44px; background: rgba(32,73,135,.7); }
.overlay.error { bottom: 44px; background: rgba(153,39,39,.8); }
.overlay.mode { bottom: 8px; background: rgba(16,38,84,.7); color: #aad5ff; }
</style>
