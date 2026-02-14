<template>
  <div class="page-container">
    <el-tabs v-model="activeTab" @tab-change="onTabChange">
      <el-tab-pane label="事件列表" name="events">
        <EventsListTab
          :query="eventQuery"
          :meta="{ rules: meta.rules }"
          :list="eventList"
          :loading="eventLoading"
          :error="eventError"
          :total="eventTotal"
          @apply="applyEvents"
          @go-detail="goEventDetail"
        />
      </el-tab-pane>
      <el-tab-pane label="快照 Snapshots" name="snapshots">
        <SnapshotsTab
          :query="snapshotQuery"
          :list="snapshotList"
          :loading="snapshotLoading"
          :error="snapshotError"
          :total="snapshotTotal"
          :meta="{ sites: meta.sites, versions: meta.versions, rules: meta.rules }"
          :downloading-map="downloadingMap"
          @apply="applySnapshots"
          @view="openSnapshot"
          @download="downloadSnapshot"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { downloadSnapshotDetail } from '@/api/endpoints';
import { useMetaStore } from '@/store/meta';
import { useEventsQuery } from './useEventsQuery';
import { useSnapshotsQuery } from './useSnapshotsQuery';
import EventsListTab from './EventsListTab.vue';
import SnapshotsTab from './SnapshotsTab.vue';

const route = useRoute();
const router = useRouter();
const meta = useMetaStore();
const downloadingMap = ref<Record<string, boolean>>({});

const activeTab = ref(route.query.snapshotId || route.query.tab === 'snapshots' ? 'snapshots' : 'events');

const { query: eventQuery, loading: eventLoading, error: eventError, list: eventList, total: eventTotal, search: searchEvents } =
  useEventsQuery({
    start: String(route.query.start ?? ''),
    end: String(route.query.end ?? ''),
    siteIds: String(route.query.siteIds ?? '').split(',').filter(Boolean),
    versionIds: String(route.query.versionIds ?? '').split(',').filter(Boolean),
    q: String(route.query.q ?? ''),
    ruleId: String(route.query.ruleId ?? ''),
    env: (route.query.env as 'blue' | 'green' | '') ?? '',
    severity: (route.query.severity as 'P0' | 'P1' | 'P2' | 'P3' | '') ?? '',
    page: Number(route.query.page ?? 1),
    pageSize: Number(route.query.pageSize ?? 20),
    sort: String(route.query.sort ?? '')
  });

const { query: snapshotQuery, loading: snapshotLoading, error: snapshotError, list: snapshotList, total: snapshotTotal, search: searchSnapshots } =
  useSnapshotsQuery({
    createdStart: String(route.query.snapshot_start ?? ''),
    createdEnd: String(route.query.snapshot_end ?? ''),
    siteIds: String(route.query.snapshot_siteIds ?? '').split(',').filter(Boolean),
    versionIds: String(route.query.snapshot_versionIds ?? '').split(',').filter(Boolean),
    env: (route.query.snapshot_env as 'blue' | 'green' | '') ?? '',
    severity: (route.query.snapshot_severity as 'P0' | 'P1' | 'P2' | 'P3' | '') ?? '',
    ruleId: String(route.query.snapshot_ruleId ?? ''),
    createdBy: String(route.query.snapshot_createdBy ?? ''),
    q: String(route.query.snapshot_q ?? ''),
    page: Number(route.query.snapshot_page ?? 1),
    pageSize: Number(route.query.snapshot_pageSize ?? 10),
    sort: String(route.query.snapshot_sort ?? 'createdAt:desc')
  });

const applyEvents = async () => {
  await router.replace({
    query: {
      ...route.query,
      tab: activeTab.value,
      start: eventQuery.start,
      end: eventQuery.end,
      siteIds: eventQuery.siteIds?.join(',') ?? '',
      versionIds: eventQuery.versionIds?.join(',') ?? '',
      env: eventQuery.env ?? '',
      severity: eventQuery.severity ?? '',
      ruleId: eventQuery.ruleId ?? '',
      q: eventQuery.q ?? '',
      page: String(eventQuery.page ?? 1),
      pageSize: String(eventQuery.pageSize ?? 20),
      sort: eventQuery.sort ?? ''
    }
  });
  await searchEvents();
};

const applySnapshots = async () => {
  await router.replace({
    query: {
      ...route.query,
      tab: activeTab.value,
      snapshot_start: snapshotQuery.createdStart ?? '',
      snapshot_end: snapshotQuery.createdEnd ?? '',
      snapshot_siteIds: snapshotQuery.siteIds?.join(',') ?? '',
      snapshot_versionIds: snapshotQuery.versionIds?.join(',') ?? '',
      snapshot_env: snapshotQuery.env ?? '',
      snapshot_severity: snapshotQuery.severity ?? '',
      snapshot_ruleId: snapshotQuery.ruleId ?? '',
      snapshot_createdBy: snapshotQuery.createdBy ?? '',
      snapshot_q: snapshotQuery.q ?? '',
      snapshot_page: String(snapshotQuery.page ?? 1),
      snapshot_pageSize: String(snapshotQuery.pageSize ?? 10),
      snapshot_sort: snapshotQuery.sort ?? ''
    }
  });
  await searchSnapshots();
};

const onTabChange = async (tab: string | number) => {
  activeTab.value = String(tab);
  await router.replace({ query: { ...route.query, tab: activeTab.value } });
  if (activeTab.value === 'events') {
    await applyEvents();
  } else {
    await applySnapshots();
  }
};

const goEventDetail = (id: string) => router.push({ path: `/events/${id}`, query: route.query });
const openSnapshot = (id: string) => router.push({ path: `/events/snapshots/${id}`, query: { ...route.query, tab: 'snapshots', snapshotId: id } });

const downloadSnapshot = async (id: string, format: 'csv' | 'json') => {
  if (downloadingMap.value[id]) return;
  downloadingMap.value[id] = true;
  try {
    const blob = await downloadSnapshotDetail(id, format);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${id}-detail.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  } finally {
    downloadingMap.value[id] = false;
  }
};

onMounted(async () => {
  await meta.bootstrap();
  await applyEvents();
  await applySnapshots();
});
</script>
