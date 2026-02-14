<template>
  <div class="page-container">
    <FilterBar v-model="filter" :sites="meta.sites" :versions="meta.versions" @search="applyFilter" />
    <el-skeleton :loading="loading" animated>
      <ErrorState v-if="error" :message="error" />
      <EmptyState v-else-if="!summary || !summary.trend.length" />
      <template v-else>
        <el-row :gutter="12">
          <el-col :span="12">
            <ChartCard title="事件总量趋势">
              <VChart :option="trendOption" autoresize style="height: 280px" @click="jumpToEvents" />
            </ChartCard>
          </el-col>
          <el-col :span="12">
            <ChartCard title="蓝绿对比">
              <VChart :option="envOption" autoresize style="height: 280px" @click="jumpToEvents" />
            </ChartCard>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <ChartCard title="Top 10 告警类型">
              <VChart :option="ruleOption" autoresize style="height: 320px" @click="jumpToEvents" />
            </ChartCard>
          </el-col>
          <el-col :span="12">
            <ChartCard title="局点健康度排行">
              <el-table :data="summary.siteHealth" size="small">
                <el-table-column prop="siteName" label="局点" />
                <el-table-column prop="eventCount" label="事件数" />
                <el-table-column prop="anomalyScore" label="异常指数" />
              </el-table>
            </ChartCard>
            <ChartCard title="版本异常指数排行">
              <el-table :data="summary.versionAnomaly" size="small">
                <el-table-column prop="versionLabel" label="版本" />
                <el-table-column prop="eventCount" label="事件数" />
                <el-table-column prop="anomalyScore" label="异常指数" />
              </el-table>
            </ChartCard>
          </el-col>
        </el-row>
      </template>
    </el-skeleton>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ChartCard from '@/components/ChartCard.vue';
import EmptyState from '@/components/EmptyState.vue';
import ErrorState from '@/components/ErrorState.vue';
import FilterBar from '@/components/FilterBar.vue';
import { useMetaStore } from '@/store/meta';
import { useDashboardData } from './useDashboardData';
import { barOption, lineOption } from '@/utils/chartOptions';
import { defaultDateRange } from '@/utils/date';

const meta = useMetaStore();
const route = useRoute();
const router = useRouter();
const [start, end] = defaultDateRange();

const filter = reactive({
  start: String(route.query.start ?? start),
  end: String(route.query.end ?? end),
  siteIds: String(route.query.siteIds ?? '').split(',').filter(Boolean),
  versionIds: String(route.query.versionIds ?? '').split(',').filter(Boolean),
  env: String(route.query.env ?? '')
});

const { data: summary, loading, error, load } = useDashboardData();

const applyFilter = async () => {
  const query = {
    ...filter,
    siteIds: filter.siteIds.join(','),
    versionIds: filter.versionIds.join(',')
  };
  router.replace({ query });
  await load(query);
};

onMounted(async () => {
  await meta.bootstrap();
  await applyFilter();
});

const trendOption = computed(() =>
  lineOption(
    summary.value?.trend.map((i) => i.date) ?? [],
    [{ name: '总量', data: summary.value?.trend.map((i) => i.total) ?? [] }]
  )
);
const envOption = computed(() =>
  lineOption(
    summary.value?.trend.map((i) => i.date) ?? [],
    [
      { name: 'blue', data: summary.value?.trend.map((i) => i.blue) ?? [] },
      { name: 'green', data: summary.value?.trend.map((i) => i.green) ?? [] }
    ]
  )
);
const ruleOption = computed(() =>
  barOption(
    summary.value?.topRules.map((i) => i.ruleName) ?? [],
    summary.value?.topRules.map((i) => i.count) ?? [],
    '事件数',
    true
  )
);

const jumpToEvents = () => {
  router.push({ path: '/events', query: { ...route.query } });
};
</script>
