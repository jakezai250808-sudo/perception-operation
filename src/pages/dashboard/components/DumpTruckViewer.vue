<template>
  <div class="viewer-shell">
    <div ref="canvasEl" class="canvas-host" />
    <div v-if="loading" class="overlay loading">模型加载中 {{ progress }}%</div>
    <div v-else-if="error" class="overlay error">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
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

type OverlayType = 'camera' | 'radar' | 'lidar' | 'redundancy';

const props = defineProps<{
  modelUrl: string;
  activeTypes: OverlayType[];
}>();

const canvasEl = ref<HTMLDivElement | null>(null);
const loading = ref(true);
const error = ref('');
const progress = ref(0);

const route = useRoute();
const debugAnchors = String(route.query.debugAnchors ?? '') === '1';

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let controls: OrbitControls | null = null;
let frameId = 0;
let resizeObserver: ResizeObserver | null = null;
let rootModel: THREE.Object3D | null = null;
let overlayLayer: THREE.Group | null = null;
let anchors: AnchorsMap | null = null;
let debugObjects: THREE.Object3D[] = [];

const activeRigMap = new Map<OverlayType, OverlayRig[]>();

const overlayAnchorMap: Record<OverlayType, AnchorKey[]> = {
  camera: ['roof_front', 'cab_left', 'cab_right', 'bumper_rear'],
  radar: ['bumper_front', 'bumper_rear', 'dump_body_left', 'dump_body_right'],
  lidar: ['roof_center', 'roof_front'],
  redundancy: ['roof_center', 'dump_body_left']
};

const createRigByType = (type: OverlayType): OverlayRig => {
  switch (type) {
    case 'camera':
      return createCameraRig();
    case 'radar':
      return createRadarRig();
    case 'lidar':
      return createLidarRig();
    case 'redundancy':
      return createRedundancyRig();
    default:
      return createCameraRig();
  }
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
    onUpdate: (value) => {
      rig.root.scale.setScalar(0.2 + value * 0.8);
      rig.root.position.y = baseY - (1 - value) * 0.35;
      rig.animatedMaterials.forEach((mat) => {
        mat.opacity = value;
      });
    }
  });

  tween({
    from: 0,
    to: 1,
    duration: 300,
    onUpdate: (value) => {
      if (rig.pulseMaterial) {
        rig.pulseMaterial.emissiveIntensity = value * 1.5;
      }
    },
    onComplete: () => {
      tween({
        from: 1.5,
        to: 0.6,
        duration: 280,
        onUpdate: (value) => {
          if (rig.pulseMaterial) rig.pulseMaterial.emissiveIntensity = value;
        }
      });
    }
  });
};

const animateOut = (rig: OverlayRig, done: () => void) => {
  tween({
    from: 1,
    to: 0,
    duration: 280,
    onUpdate: (value) => {
      rig.root.scale.setScalar(0.85 + value * 0.15);
      rig.animatedMaterials.forEach((mat) => {
        mat.opacity = value;
        mat.emissiveIntensity = value * 0.4;
      });
    },
    onComplete: done
  });
};

const addTypeOverlays = (type: OverlayType) => {
  if (!anchors || !overlayLayer) return;
  const anchorKeys = overlayAnchorMap[type] ?? [];
  const rigs = anchorKeys.map((anchorKey) => {
    const rig = createRigByType(type);
    rig.root.position.copy(anchors![anchorKey]);
    overlayLayer!.add(rig.root);
    animateIn(rig);
    return rig;
  });
  activeRigMap.set(type, rigs);
};

const removeTypeOverlays = (type: OverlayType) => {
  const rigs = activeRigMap.get(type) ?? [];
  rigs.forEach((rig) => {
    animateOut(rig, () => {
      overlayLayer?.remove(rig.root);
      rig.root.traverse((node) => {
        const mesh = node as THREE.Mesh;
        mesh.geometry?.dispose?.();
        const mat = mesh.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat?.dispose?.();
      });
    });
  });
  activeRigMap.delete(type);
};

const syncOverlays = (next: OverlayType[]) => {
  const current = new Set(activeRigMap.keys());
  const target = new Set(next);

  current.forEach((type) => {
    if (!target.has(type)) removeTypeOverlays(type);
  });

  target.forEach((type) => {
    if (!current.has(type)) addTypeOverlays(type);
  });
};

const renderLoop = () => {
  frameId = requestAnimationFrame(renderLoop);
  const now = performance.now() * 0.001;
  activeRigMap.forEach((rigs, type) => {
    rigs.forEach((rig) => {
      if (type === 'lidar' && rig.spinner) {
        rig.spinner.rotation.z += 0.04;
      }
      if (type === 'camera' && rig.blinker && rig.pulseMaterial) {
        rig.pulseMaterial.emissiveIntensity = 0.3 + Math.sin(now * 2) * 0.12;
      }
    });
  });
  controls?.update();
  if (scene && camera) renderer?.render(scene, camera);
};

onMounted(() => {
  if (!canvasEl.value) return;

  scene = new THREE.Scene();
  scene.background = new THREE.Color('#060c18');
  scene.fog = new THREE.Fog('#060c18', 8, 40);

  camera = new THREE.PerspectiveCamera(48, 1, 0.1, 200);
  camera.position.set(6, 3, 6);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  canvasEl.value.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 1.2, 0);
  controls.minDistance = 3;
  controls.maxDistance = 14;
  controls.maxPolarAngle = Math.PI / 2.2;

  const hemi = new THREE.HemisphereLight('#8fb8ff', '#263142', 1.1);
  scene.add(hemi);

  const keyLight = new THREE.DirectionalLight('#d8ebff', 1.2);
  keyLight.position.set(8, 12, 4);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  scene.add(keyLight);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(9, 64),
    new THREE.MeshStandardMaterial({
      color: '#132238',
      roughness: 0.28,
      metalness: 0.3,
      transparent: true,
      opacity: 0.82
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.01;
  floor.receiveShadow = true;
  scene.add(floor);

  overlayLayer = new THREE.Group();
  scene.add(overlayLayer);

  const loader = new GLTFLoader();
  loader.load(
    props.modelUrl,
    (gltf) => {
      rootModel = gltf.scene;
      rootModel.traverse((node) => {
        const mesh = node as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });

      const box = new THREE.Box3().setFromObject(rootModel);
      const center = box.getCenter(new THREE.Vector3());
      rootModel.position.sub(center);
      const size = box.getSize(new THREE.Vector3());
      const scale = 4 / Math.max(size.x, size.y, size.z);
      rootModel.scale.setScalar(scale);

      scene?.add(rootModel);

      anchors = inferAnchors(rootModel);
      if (debugAnchors) {
        debugObjects = createAnchorDebugObjects(anchors);
        debugObjects.forEach((obj) => overlayLayer?.add(obj));
      }

      loading.value = false;
      syncOverlays(props.activeTypes);
    },
    (evt) => {
      if (!evt.total) return;
      progress.value = Math.min(100, Math.round((evt.loaded / evt.total) * 100));
    },
    () => {
      error.value = '模型加载失败：请检查 public/assets/models/dump_truck.glb 是否存在';
      loading.value = false;
    }
  );

  resizeObserver = new ResizeObserver((entries) => {
    const box = entries[0]?.contentRect;
    if (!box || !camera || !renderer) return;
    camera.aspect = box.width / box.height;
    camera.updateProjectionMatrix();
    renderer.setSize(box.width, box.height);
  });
  resizeObserver.observe(canvasEl.value);

  renderLoop();
});

watch(
  () => props.activeTypes,
  (types) => {
    if (!loading.value && !error.value) {
      syncOverlays(types);
    }
  },
  { deep: true }
);

onBeforeUnmount(() => {
  cancelAnimationFrame(frameId);
  resizeObserver?.disconnect();
  controls?.dispose();
  renderer?.dispose();

  if (scene) {
    scene.traverse((node) => {
      const mesh = node as THREE.Mesh;
      mesh.geometry?.dispose?.();
      const material = mesh.material;
      if (Array.isArray(material)) material.forEach((mat) => mat.dispose());
      else material?.dispose?.();
    });
  }
});
</script>

<style scoped>
.viewer-shell {
  position: relative;
  height: 420px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(95, 155, 255, 0.35);
  background: radial-gradient(circle at 20% 18%, rgba(62, 135, 255, 0.28), rgba(5, 11, 24, 0.96));
}

.canvas-host {
  width: 100%;
  height: 100%;
}

.overlay {
  position: absolute;
  inset: auto 12px 12px 12px;
  padding: 8px 10px;
  border-radius: 10px;
  font-size: 13px;
}

.overlay.loading {
  background: rgba(32, 73, 135, 0.7);
}

.overlay.error {
  background: rgba(153, 39, 39, 0.8);
}
</style>
