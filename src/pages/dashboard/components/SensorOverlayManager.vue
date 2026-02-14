<template>
  <div class="overlay-root">
    <template v-if="mode === 'frames'">
      <transition-group name="sensor-fade">
        <div
          v-for="item in overlayItems"
          :key="item.id"
          class="sensor-2d"
          :class="`type-${item.type}`"
          :style="{ left: `${item.x}%`, top: `${item.y}%` }"
        >
          <img :src="item.icon" :alt="item.type" />
        </div>
      </transition-group>
      <div v-if="debugAnchors" class="anchors-debug">
        <div v-for="(v, k) in anchors2d" :key="k" class="anchor-point" :style="{ left: `${v.x}%`, top: `${v.y}%` }">+</div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type OverlayType = 'camera' | 'radar' | 'lidar' | 'redundancy';

type Anchor2D = { x: number; y: number };

const props = defineProps<{
  mode: 'frames' | 'model';
  activeTypes: OverlayType[];
  anchors2d: Record<string, Anchor2D>;
  debugAnchors: boolean;
}>();

const anchorMap: Record<OverlayType, string[]> = {
  camera: ['roof_front', 'bumper_rear', 'dump_body_left'],
  radar: ['bumper_front', 'bumper_rear'],
  lidar: ['roof_center'],
  redundancy: ['roof_front', 'dump_body_right']
};

const iconByType: Record<OverlayType, string> = {
  camera: '/assets/sensors/camera.svg',
  radar: '/assets/sensors/radar.svg',
  lidar: '/assets/sensors/lidar.svg',
  redundancy: '/assets/sensors/redundancy.svg'
};

const overlayItems = computed(() => {
  const items: Array<{ id: string; type: OverlayType; x: number; y: number; icon: string }> = [];
  props.activeTypes.forEach((type) => {
    (anchorMap[type] ?? []).forEach((anchor) => {
      const p = props.anchors2d[anchor];
      if (!p) return;
      items.push({ id: `${type}-${anchor}`, type, x: p.x, y: p.y, icon: iconByType[type] });
    });
  });
  return items;
});
</script>

<style scoped>
.overlay-root { position: absolute; inset: 0; pointer-events: none; }
.sensor-2d { position: absolute; width: 44px; height: 44px; transform: translate(-50%, -50%); filter: drop-shadow(0 0 10px rgba(100,180,255,.6)); }
.sensor-2d img { width: 100%; height: 100%; object-fit: contain; }
.type-radar { width: 42px; height: 28px; }
.type-lidar { width: 48px; height: 48px; }
.anchors-debug .anchor-point { position:absolute; transform:translate(-50%,-50%); color:#7fd2ff; font-weight:700; font-size:16px; }
.sensor-fade-enter-active,.sensor-fade-leave-active { transition: all .3s ease; }
.sensor-fade-enter-from,.sensor-fade-leave-to { opacity:0; transform: translate(-50%, -60%) scale(.6); }
</style>
