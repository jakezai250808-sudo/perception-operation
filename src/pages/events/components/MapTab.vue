<template>
  <div>
    <MapFilters v-model="mapQuery" :sites="meta.sites" :versions="meta.versions" :rules="meta.rules" @search="apply" />
    <el-row :gutter="12">
      <el-col :span="listCollapsed ? 0 : 7" v-if="!listCollapsed">
        <MapEventList :events="geoItems" :selected-id="selectedEvent?.id" :collapsed="listCollapsed" @select="selectEvent" @toggle-collapse="listCollapsed = !listCollapsed" />
      </el-col>
      <el-col :span="listCollapsed ? 24 : 17">
        <el-card class="panel">
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span>局点地图（支持配置替换底图）</span>
              <el-space>
                <el-switch v-model="clusterOn" active-text="cluster" inactive-text="no cluster" />
                <el-button text @click="listCollapsed = !listCollapsed">{{ listCollapsed ? '显示列表' : '隐藏列表' }}</el-button>
              </el-space>
            </div>
          </template>
          <MapCanvas :polylines="polylines" :basemap-url="basemapUrl" :events="geoItems" :selected-id="selectedEvent?.id" :cluster-on="clusterOn" @select="selectEvent" @camera="onCamera" />
        </el-card>
      </el-col>
    </el-row>

    <EventDetailDrawer
      :visible="!!selectedEvent"
      :event="selectedEvent"
      @close="selectedEvent = null"
      @open-detail="openDetail"
      @open-pcd="pointCloudVisible = true"
    />

    <PointCloudViewer :visible="pointCloudVisible" :event-id="selectedEvent?.id ?? null" @close="pointCloudVisible = false" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { GeoEvent } from '@/types';
import { useMetaStore } from '@/store/meta';
import { useGeoEvents } from '../hooks/useGeoEvents';
import { useMapQuery } from '../hooks/useMapQuery';
import { useXodrMap } from '../hooks/useXodrMap';
import MapFilters from './MapFilters.vue';
import MapEventList from './MapEventList.vue';
import MapCanvas from './MapCanvas.vue';
import EventDetailDrawer from './EventDetailDrawer.vue';
import PointCloudViewer from './PointCloudViewer.vue';

const route = useRoute();
const router = useRouter();
const meta = useMetaStore();

const { query: mapQuery, toRouteQuery } = useMapQuery(route.query as Record<string, unknown>, meta.sites[0]?.id ?? 'site-bj');
const { items: geoItems, load: loadGeo } = useGeoEvents();
const { polylines, basemapUrl, load: loadMap } = useXodrMap();

const selectedEvent = ref<GeoEvent | null>(null);
const pointCloudVisible = ref(false);
const listCollapsed = ref(false);
const clusterOn = ref(true);

const apply = async () => {
  await router.replace({ query: { ...route.query, tab: 'map', ...toRouteQuery() } });
  await Promise.all([
    loadMap(mapQuery.siteId),
    loadGeo({
      siteId: mapQuery.siteId,
      start: mapQuery.start,
      end: mapQuery.end,
      env: mapQuery.env,
      versionIds: mapQuery.versionIds.join(','),
      severity: mapQuery.severity.join(','),
      ruleId: mapQuery.ruleId,
      q: mapQuery.q,
      limit: 1000
    })
  ]);
};

const selectEvent = (event: GeoEvent) => {
  selectedEvent.value = event;
};

const openDetail = () => {
  if (!selectedEvent.value) return;
  router.push({ path: `/events/${selectedEvent.value.id}`, query: { ...route.query, tab: 'map' } });
};

const onCamera = (x: number, y: number, z: number) => {
  mapQuery.centerX = Number(x.toFixed(2));
  mapQuery.centerY = Number(y.toFixed(2));
  mapQuery.zoom = Number(z.toFixed(2));
};

onMounted(async () => {
  if (!meta.sites.length) await meta.bootstrap();
  if (!mapQuery.siteId) mapQuery.siteId = meta.sites[0]?.id ?? 'site-bj';
  await apply();
});
</script>
