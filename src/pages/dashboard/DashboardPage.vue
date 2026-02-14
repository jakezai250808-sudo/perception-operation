<template>
  <div class="page-container dashboard-page">
    <el-tabs v-model="activeTab" class="dashboard-tabs">
      <el-tab-pane label="概览 Overview" name="overview" />
      <el-tab-pane label="🚗 乘用车智驾选配" name="configurator" />
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
          <h3>Urban Pilot 选配中心</h3>
          <p>向右点击最多 4 次，逐步叠加自动驾驶硬件套件（摄像头 / 毫米波雷达 / 激光雷达）。</p>
        </div>
        <el-button type="primary" :disabled="selectedStep >= 4" @click="addPackage">右滑选配 ➜</el-button>
      </div>

      <el-progress :percentage="selectedStep * 25" :stroke-width="14" status="success" />

      <div class="package-track">
        <div
          v-for="item in packages"
          :key="item.step"
          class="package-card"
          :class="{ active: selectedStep >= item.step }"
        >
          <div class="package-index">STEP {{ item.step }}</div>
          <h4>{{ item.title }}</h4>
          <p>{{ item.description }}</p>
          <el-tag type="info" effect="dark">{{ item.sensor }}</el-tag>
        </div>
      </div>

      <ChartCard title="已激活配置">
        <el-empty v-if="activePackages.length === 0" description="请点击右滑选配开始组合" />
        <el-space v-else wrap>
          <el-tag
            v-for="(item, index) in activePackages"
            :key="item.step"
            :type="index % 2 === 0 ? 'success' : 'warning'"
            size="large"
            effect="dark"
          >
            {{ item.title }} · {{ item.sensor }}
          </el-tag>
        </el-space>
      </ChartCard>
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

const meta = useMetaStore();
const route = useRoute();
const router = useRouter();
const [start, end] = defaultDateRange();
const activeTab = ref<'overview' | 'configurator'>('overview');
const selectedStep = ref(0);

const packages = [
  {
    step: 1,
    title: '城市视觉包',
    description: '增加 8M 前视相机 + 环视拼接，提高近场目标识别率。',
    sensor: 'Camera x 6'
  },
  {
    step: 2,
    title: '全天候雷达包',
    description: '叠加毫米波雷达融合，增强雨雾工况下的探测稳定性。',
    sensor: '毫米波雷达 x 5'
  },
  {
    step: 3,
    title: '高精点云包',
    description: '增加激光雷达主传感器，提升三维障碍物轮廓与空间重建精度。',
    sensor: '激光雷达 x 1'
  },
  {
    step: 4,
    title: 'NOA 旗舰套件',
    description: '融合 Camera + 毫米波 + 激光雷达，实现城区领航与复杂路口博弈策略。',
    sensor: '多传感融合'
  }
] as const;

const activePackages = computed(() => packages.filter((item) => item.step <= selectedStep.value));

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

const addPackage = () => {
  if (selectedStep.value < 4) {
    selectedStep.value += 1;
  }
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
  gap: 16px;
  padding: 8px 4px;
}

.hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 14px;
  background: linear-gradient(120deg, rgba(43, 94, 242, 0.2), rgba(0, 185, 255, 0.08));
  border: 1px solid rgba(120, 180, 255, 0.35);
}

.hero h3 {
  margin: 0;
  font-size: 18px;
}

.hero p {
  margin: 6px 0 0;
  opacity: 0.9;
}

.package-track {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.package-card {
  padding: 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.25s ease;
  min-height: 150px;
}

.package-card.active {
  border-color: #4ea1ff;
  box-shadow: 0 8px 24px rgba(78, 161, 255, 0.26);
  transform: translateY(-2px);
}

.package-index {
  font-size: 12px;
  opacity: 0.75;
  margin-bottom: 8px;
}

.package-card h4 {
  margin: 0 0 8px;
}

.package-card p {
  margin: 0 0 10px;
  font-size: 13px;
  line-height: 1.4;
  min-height: 54px;
}

@media (max-width: 1200px) {
  .package-track {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
