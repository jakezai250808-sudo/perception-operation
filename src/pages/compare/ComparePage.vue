<template>
  <div class="page-container" style="display: flex; gap: 12px">
    <el-card class="panel" style="width: 320px; height: calc(100vh - 130px); overflow: auto">
      <el-form label-position="top">
        <el-form-item label="模式">
          <el-radio-group v-model="form.mode">
            <el-radio-button label="env">蓝 vs 绿</el-radio-button>
            <el-radio-button label="version">版本A vs 版本B</el-radio-button>
            <el-radio-button label="site">局点1 vs 局点2</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="时间">
          <el-date-picker v-model="range" type="daterange" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="局点A"><el-select v-model="form.siteA"><el-option v-for="s in meta.sites" :key="s.id" :value="s.id" :label="s.name" /></el-select></el-form-item>
        <el-form-item label="局点B"><el-select v-model="form.siteB"><el-option v-for="s in meta.sites" :key="s.id" :value="s.id" :label="s.name" /></el-select></el-form-item>
        <el-form-item label="版本A"><el-select v-model="form.versionA"><el-option v-for="v in meta.versions" :key="v.id" :value="v.id" :label="v.label" /></el-select></el-form-item>
        <el-form-item label="版本B"><el-select v-model="form.versionB"><el-option v-for="v in meta.versions" :key="v.id" :value="v.id" :label="v.label" /></el-select></el-form-item>
        <el-form-item label="环境">
          <el-select v-model="form.envA"><el-option value="blue" label="blue" /><el-option value="green" label="green" /></el-select>
        </el-form-item>
        <el-button type="primary" @click="search">分析</el-button>
      </el-form>
    </el-card>

    <div style="flex: 1">
      <el-skeleton :loading="loading" animated>
        <ErrorState v-if="error" :message="error" />
        <EmptyState v-else-if="!data" />
        <template v-else>
          <el-row :gutter="12">
            <el-col :span="8"><ChartCard title="总量A">{{ data.totalA }}</ChartCard></el-col>
            <el-col :span="8"><ChartCard title="总量B">{{ data.totalB }}</ChartCard></el-col>
            <el-col :span="8"><ChartCard title="差异率">{{ data.diffRate }}%</ChartCard></el-col>
          </el-row>
          <ChartCard title="趋势叠加">
            <template #actions><el-button size="small" @click="exportTrend">导出CSV</el-button></template>
            <VChart :option="trendOption" style="height: 280px" autoresize />
          </ChartCard>
          <ChartCard title="差异率排名">
            <template #actions><el-button size="small" @click="exportRanking">导出CSV</el-button></template>
            <el-table :data="data.diffRanking.slice(0, 10)">
              <el-table-column prop="key" label="规则" />
              <el-table-column prop="a" label="A" />
              <el-table-column prop="b" label="B" />
              <el-table-column prop="diffRate" label="Diff%" />
            </el-table>
          </ChartCard>
        </template>
      </el-skeleton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue';
import ChartCard from '@/components/ChartCard.vue';
import EmptyState from '@/components/EmptyState.vue';
import ErrorState from '@/components/ErrorState.vue';
import { useMetaStore } from '@/store/meta';
import { defaultDateRange } from '@/utils/date';
import { lineOption } from '@/utils/chartOptions';
import { exportToCsv } from '@/utils/csv';
import { useCompareData } from './useCompareData';

const meta = useMetaStore();
const [start, end] = defaultDateRange();
const form = reactive({
  mode: 'env',
  start,
  end,
  siteA: 'site-bj',
  siteB: 'site-sh',
  versionA: 'v2.10.0',
  versionB: 'v2.9.1',
  envA: 'green',
  severity: '',
  ruleId: ''
});

const range = computed({
  get: () => [form.start, form.end],
  set: (v) => {
    form.start = v?.[0] ?? '';
    form.end = v?.[1] ?? '';
  }
});

const { data, loading, error, load } = useCompareData();
const search = async () => load(form as unknown as Record<string, string>);

onMounted(async () => {
  await meta.bootstrap();
  await search();
});

const trendOption = computed(() =>
  lineOption(
    data.value?.trend.map((i) => i.date) ?? [],
    [
      { name: 'A', data: data.value?.trend.map((i) => i.a) ?? [] },
      { name: 'B', data: data.value?.trend.map((i) => i.b) ?? [] }
    ]
  )
);

const exportTrend = () => exportToCsv('compare-trend.csv', data.value?.trend ?? []);
const exportRanking = () => exportToCsv('compare-ranking.csv', data.value?.diffRanking ?? []);
</script>
