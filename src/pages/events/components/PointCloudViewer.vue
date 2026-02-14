<template>
  <el-dialog :model-value="visible" title="点云查看器" width="80%" @close="$emit('close')">
    <el-skeleton :loading="loading" animated>
      <ErrorState v-if="error" :message="error" />
      <el-empty v-else-if="!assets.length" description="暂无点云资源" />
      <template v-else>
        <el-space style="margin-bottom: 10px">
          <el-select v-model="selectedId" style="width: 280px" @change="loadPcd">
            <el-option v-for="a in assets" :key="a.id" :value="a.id" :label="`${a.sensor || 'sensor'} · ${a.pointCount || 0}pts · ${a.fileSizeMb || 0}MB`" />
          </el-select>
          <el-slider v-model="pointSize" :min="0.1" :max="5" :step="0.1" style="width: 180px" @change="applyPointSize" />
          <el-button @click="downloadCurrent">下载原始PCD</el-button>
          <el-button @click="$emit('close')">回到地图</el-button>
        </el-space>
        <div ref="container" style="height: 520px; width: 100%; border:1px solid var(--border-soft)"></div>
      </template>
    </el-skeleton>
  </el-dialog>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader.js';
import { getPointCloudAssets } from '@/api/pointcloud';
import type { PointCloudAsset } from '@/types';
import ErrorState from '@/components/ErrorState.vue';

const props = defineProps<{ visible: boolean; eventId: string | null }>();
defineEmits<{ close: [] }>();

const container = ref<HTMLDivElement | null>(null);
const loading = ref(false);
const error = ref('');
const assets = ref<PointCloudAsset[]>([]);
const selectedId = ref('');
const pointSize = ref(1);
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let points: THREE.Points | null = null;
let animation = 0;

const init = async () => {
  await nextTick();
  if (!container.value) return;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, container.value.clientWidth / container.value.clientHeight, 0.1, 10000);
  camera.position.set(0, 0, 30);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.value.clientWidth, container.value.clientHeight);
  renderer.setClearColor(0x101826);
  container.value.innerHTML = '';
  container.value.appendChild(renderer.domElement);
  controls = new OrbitControls(camera, renderer.domElement);
  const light = new THREE.AmbientLight(0xffffff, 1);
  scene.add(light);
  const run = () => {
    controls.update();
    renderer.render(scene, camera);
    animation = requestAnimationFrame(run);
  };
  run();
};

const applyPointSize = () => {
  if (points?.material && 'size' in points.material) {
    (points.material as THREE.PointsMaterial).size = pointSize.value;
  }
};

const loadAssets = async () => {
  if (!props.eventId) return;
  loading.value = true;
  try {
    const res = await getPointCloudAssets(props.eventId);
    assets.value = res.items;
    selectedId.value = assets.value[0]?.id ?? '';
    error.value = '';
    if (selectedId.value) await loadPcd();
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
};

const loadPcd = async () => {
  const asset = assets.value.find((a) => a.id === selectedId.value);
  if (!asset || !scene) return;
  const loader = new PCDLoader();
  const loaded = await loader.loadAsync(asset.url);
  if (points) scene.remove(points);
  points = loaded;
  if (points.material && 'size' in points.material) {
    (points.material as THREE.PointsMaterial).size = pointSize.value;
  }
  scene.add(points);
};

const downloadCurrent = () => {
  const asset = assets.value.find((a) => a.id === selectedId.value);
  if (!asset) return;
  const a = document.createElement('a');
  a.href = asset.url;
  a.download = asset.url.split('/').pop() || `${asset.id}.pcd`;
  a.click();
};

watch(
  () => props.visible,
  async (v) => {
    if (!v) return;
    await init();
    await loadAssets();
  }
);

onBeforeUnmount(() => {
  cancelAnimationFrame(animation);
  controls?.dispose();
  renderer?.dispose();
});
</script>
