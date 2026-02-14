<template>
  <div class="page-container dashboard-page">
    <el-tabs v-model="activeTab" class="dashboard-tabs">
      <el-tab-pane label="概览 Overview" name="overview" />
      <el-tab-pane label="🚚 宽体自卸车智驾选配" name="configurator" />
    </el-tabs>

    <section v-if="activeTab === 'overview'">
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
    </section>

    <section v-else class="configurator-panel">
      <div class="hero">
        <div>
          <h3>非公路矿用宽体自卸车 · 智驾选配 Demo</h3>
          <p>点击“下一步选配”逐步叠加硬件（最多 4 步），下方可拖拽旋转矿卡查看传感器挂载动画。</p>
        </div>
        <el-space>
          <el-button :disabled="selectedStep === 0" @click="goPrevStep">向左返回</el-button>
          <el-button type="primary" :disabled="selectedStep >= 4" @click="goNextStep">下一步选配 ➜</el-button>
        </el-space>
      </div>

      <div class="step-row">
        <el-tag effect="dark" type="success">Step {{ selectedStep }} / 4</el-tag>
        <span class="step-title">{{ currentStepName }}</span>
        <span class="step-tip">{{ selectedStep >= 4 ? '已完成全部选配' : '可继续下一步选配' }}</span>
      </div>

      <el-steps :active="selectedStep" finish-status="success" align-center>
        <el-step title="初始" description="矿卡裸车" />
        <el-step title="基础感知" description="环视相机" />
        <el-step title="增强感知" description="毫米波雷达" />
        <el-step title="高阶感知" description="激光雷达" />
        <el-step title="冗余安全" description="双备份系统" />
      </el-steps>

      <DumpTruckViewer :model-url="modelUrl" :active-types="activeOverlayTypes" />

      <el-card class="config-summary-compact" shadow="never">
        <template #header>
          <div class="summary-head">
            <span>已选配置（Mock 价格）</span>
            <span class="summary-count">{{ selectedItems.length }} 项</span>
          </div>
        </template>
        <el-empty v-if="selectedItems.length === 0" description="请点击“下一步选配”开始" :image-size="42" />
        <div v-else class="chips-wrap compact">
          <el-tag
            v-for="item in selectedItems"
            :key="item.id"
            :type="item.type === 'lidar' ? 'danger' : item.type === 'radar' ? 'warning' : item.type === 'camera' ? 'primary' : 'success'"
            size="small"
            effect="dark"
          >
            {{ item.label }} ¥{{ item.price.toLocaleString() }}
          </el-tag>
        </div>
      </el-card>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ChartCard from '@/components/ChartCard.vue';
import EmptyState from '@/components/EmptyState.vue';
import ErrorState from '@/components/ErrorState.vue';
import FilterBar from '@/components/FilterBar.vue';
import { useMetaStore } from '@/store/meta';
import { useDashboardData } from './useDashboardData';
import { barOption, lineOption } from '@/utils/chartOptions';
import { defaultDateRange } from '@/utils/date';
import DumpTruckViewer from './components/DumpTruckViewer.vue';

type OverlayType = 'camera' | 'radar' | 'lidar' | 'redundancy';

interface ConfigItem {
  id: string;
  type: OverlayType;
  label: string;
  desc: string;
  price: number;
  step: 1 | 2 | 3 | 4;
}

const meta = useMetaStore();
const route = useRoute();
const router = useRouter();
const [start, end] = defaultDateRange();
const activeTab = ref<'overview' | 'configurator'>('overview');
const selectedStep = ref(0);

const stepOverlays: Record<1 | 2 | 3 | 4, OverlayType[]> = {
  1: ['camera'],
  2: ['camera', 'radar'],
  3: ['camera', 'radar', 'lidar'],
  4: ['camera', 'radar', 'lidar', 'redundancy']
};

const configItems: ConfigItem[] = [
  { id: 'cam-surround', type: 'camera', label: '环视相机组', desc: '驾驶室+车尾环视', price: 32000, step: 1 },
  { id: 'radar-mmwave', type: 'radar', label: '毫米波雷达组', desc: '前后向测速感知', price: 46000, step: 2 },
  { id: 'lidar-main', type: 'lidar', label: '主激光雷达组', desc: '车顶主感知+前沿补盲', price: 138000, step: 3 },
  { id: 'safe-redundancy', type: 'redundancy', label: '冗余安全包', desc: '备用传感器+双计算/供电', price: 98000, step: 4 }
];

const modelUrl = '/assets/models/dump_truck_tle.glb';

const activeOverlayTypes = computed<OverlayType[]>(() => {
  if (selectedStep.value <= 0) return [];
  return stepOverlays[selectedStep.value as 1 | 2 | 3 | 4];
});

const selectedItems = computed(() => configItems.filter((item) => item.step <= selectedStep.value));

const currentStepName = computed(() => {
  const map: Record<number, string> = {
    0: '初始状态（未选配）',
    1: 'Step1 基础感知：相机环视',
    2: 'Step2 增强感知：毫米波雷达',
    3: 'Step3 高阶感知：激光雷达',
    4: 'Step4 冗余安全：备用系统'
  };
  return map[selectedStep.value] ?? '';
});

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

const goNextStep = () => {
  if (selectedStep.value < 4) selectedStep.value += 1;
};

const goPrevStep = () => {
  if (selectedStep.value > 0) selectedStep.value -= 1;
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

<style scoped>
.dashboard-tabs {
  margin-bottom: 12px;
}

.configurator-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 8px 2px;
}

.hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 14px;
  border: 1px solid rgba(87, 157, 255, 0.42);
  background: linear-gradient(120deg, rgba(35, 79, 168, 0.34), rgba(8, 16, 34, 0.9));
}

.hero h3 {
  margin: 0;
  font-size: 18px;
}

.hero p {
  margin: 6px 0 0;
  opacity: 0.92;
}

.step-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.step-title {
  font-weight: 600;
}

.step-tip {
  color: #87bfff;
  font-size: 13px;
}

.config-summary-compact {
  --el-card-padding: 10px;
}

.summary-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.summary-count {
  color: #83beff;
  font-size: 12px;
}

.chips-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chips-wrap.compact {
  gap: 6px;
  max-height: 52px;
  overflow: auto;
}

@media (max-width: 980px) {
  .hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .step-row {
    flex-wrap: wrap;
  }
}
</style>
