<template>
  <div class="page-container">
    <el-page-header @back="router.push({ path: '/events', query: { ...route.query, tab: 'snapshots' } })" title="返回快照列表" />
    <el-skeleton :loading="loading" animated>
      <ErrorState v-if="error" :message="error" />
      <template v-else-if="detail">
        <ChartCard title="快照基本信息">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="ID">{{ detail.id }}</el-descriptions-item>
            <el-descriptions-item label="状态">{{ detail.status }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ detail.createdAt }}</el-descriptions-item>
            <el-descriptions-item label="创建人">{{ detail.createdBy }}</el-descriptions-item>
            <el-descriptions-item label="时间范围">{{ detail.timeRangeStart }} ~ {{ detail.timeRangeEnd }}</el-descriptions-item>
            <el-descriptions-item label="说明">{{ detail.details.description }}</el-descriptions-item>
          </el-descriptions>
        </ChartCard>

        <ChartCard title="快照筛选条件">
          <el-space wrap>
            <el-tag>siteIds: {{ detail.filters.siteIds?.join(',') || 'all' }}</el-tag>
            <el-tag>versionIds: {{ detail.filters.versionIds?.join(',') || 'all' }}</el-tag>
            <el-tag>env: {{ detail.filters.env || 'all' }}</el-tag>
            <el-tag>severity: {{ detail.filters.severity || 'all' }}</el-tag>
            <el-tag>rule: {{ detail.filters.ruleId || 'all' }}</el-tag>
            <el-tag>q: {{ detail.filters.q || '-' }}</el-tag>
          </el-space>
        </ChartCard>

        <el-row :gutter="12">
          <el-col :span="12">
            <ChartCard title="事件总量趋势">
              <VChart :option="trendOption" style="height: 260px" autoresize />
            </ChartCard>
          </el-col>
          <el-col :span="12">
            <ChartCard title="Top规则">
              <el-table :data="detail.summary.topRules" size="small">
                <el-table-column prop="ruleName" label="规则" />
                <el-table-column prop="count" label="count" />
              </el-table>
            </ChartCard>
          </el-col>
        </el-row>

        <el-space>
          <el-button type="primary" @click="openInEvents">在事件列表中打开</el-button>
          <el-button :disabled="detail.status !== 'ready'" :loading="downloading" @click="download('csv')">下载详细数据CSV</el-button>
          <el-button :disabled="detail.status !== 'ready'" :loading="downloading" @click="download('json')">下载JSON</el-button>
          <el-button @click="copyLink">复制快照链接</el-button>
        </el-space>
      </template>
    </el-skeleton>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { downloadSnapshotDetail, getSnapshotDetail } from '@/api/endpoints';
import type { SnapshotDetail } from '@/types';
import ChartCard from '@/components/ChartCard.vue';
import ErrorState from '@/components/ErrorState.vue';
import { lineOption } from '@/utils/chartOptions';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const error = ref('');
const downloading = ref(false);
const detail = ref<SnapshotDetail | null>(null);

const load = async () => {
  loading.value = true;
  try {
    detail.value = await getSnapshotDetail(String(route.params.id));
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
};

const trendOption = computed(() =>
  lineOption(
    detail.value?.summary.trend?.map((i) => i.date) ?? [],
    [{ name: '事件数', data: detail.value?.summary.trend?.map((i) => i.value) ?? [] }]
  )
);

const openInEvents = () => {
  if (!detail.value) return;
  router.push({
    path: '/events',
    query: {
      tab: 'events',
      start: detail.value.filters.start,
      end: detail.value.filters.end,
      siteIds: detail.value.filters.siteIds?.join(','),
      versionIds: detail.value.filters.versionIds?.join(','),
      env: detail.value.filters.env,
      severity: detail.value.filters.severity,
      ruleId: detail.value.filters.ruleId,
      q: detail.value.filters.q
    }
  });
};

const download = async (format: 'csv' | 'json') => {
  if (!detail.value) return;
  downloading.value = true;
  try {
    const blob = await downloadSnapshotDetail(detail.value.id, format);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${detail.value.id}-detail.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  } finally {
    downloading.value = false;
  }
};

const copyLink = async () => {
  await navigator.clipboard.writeText(window.location.href);
};

onMounted(load);
</script>
