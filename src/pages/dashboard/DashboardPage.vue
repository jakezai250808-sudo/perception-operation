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
          <h3>Urban Pilot 宽体车选配中心</h3>
          <p>左右点击切换阶段（最多 4 步），拖拽下方宽体车可 360° 旋转查看传感器叠加效果。</p>
        </div>
        <el-space>
          <el-button :disabled="selectedStep === 0" @click="prevStep">向左返回</el-button>
          <el-button type="primary" :disabled="selectedStep >= 4" @click="nextStep">向右选配 ➜</el-button>
        </el-space>
      </div>

      <div class="stage-header">
        <el-tag type="success" effect="dark">当前阶段：Step {{ selectedStep }} / 4</el-tag>
        <span class="step-name">{{ currentStepTitle }}</span>
        <span class="step-tip">{{ stepHint }}</span>
      </div>

      <el-steps :active="selectedStep" finish-status="success" class="stage-indicator" align-center>
        <el-step title="初始" description="无选配" />
        <el-step title="基础感知包" description="增加相机" />
        <el-step title="增强感知包" description="增加毫米波雷达" />
        <el-step title="高阶感知包" description="增加激光雷达" />
        <el-step title="冗余安全包" description="增加备用感知模块" />
      </el-steps>

      <div
        class="vehicle-stage"
        @mousedown="onDragStart"
        @mousemove="onDragMove"
        @mouseup="onDragEnd"
        @mouseleave="onDragEnd"
        @touchstart.passive="onTouchStart"
        @touchmove.passive="onTouchMove"
        @touchend="onDragEnd"
      >
        <div class="bg-glow" />
        <div class="ground-reflection" />

        <div class="car-wrap" :style="carTransformStyle">
          <div class="car-shadow" />
          <div class="car-body" />
          <div class="car-roof" />
          <div class="wheel-arch front" />
          <div class="wheel-arch rear" />
          <div class="wheel front" />
          <div class="wheel rear" />

          <transition-group name="module-fade">
            <div
              v-for="module in activeModules"
              :key="module.id"
              class="sensor-module"
              :class="[`type-${module.type}`, `pos-${module.position}`]"
            >
              <span>{{ module.label }}</span>
            </div>
          </transition-group>
        </div>
      </div>

      <ChartCard title="已激活配置模块">
        <el-empty v-if="activeModules.length === 0" description="请点击“向右选配”开始配置" />
        <el-space v-else wrap>
          <el-tag
            v-for="item in activeModules"
            :key="item.id"
            :type="item.type === 'lidar' ? 'danger' : item.type === 'radar' ? 'warning' : 'success'"
            size="large"
            effect="dark"
          >
            {{ item.label }} · {{ item.description }}
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

type SensorType = 'camera' | 'radar' | 'lidar' | 'redundant';
type SensorPosition = 'front' | 'rear' | 'roof' | 'left' | 'right' | 'roof-rear';

interface SensorModule {
  id: string;
  label: string;
  type: SensorType;
  position: SensorPosition;
  description: string;
}

interface PackageStep {
  step: number;
  title: string;
  modules: SensorModule[];
}

const meta = useMetaStore();
const route = useRoute();
const router = useRouter();
const [start, end] = defaultDateRange();
const activeTab = ref<'overview' | 'configurator'>('overview');
const selectedStep = ref(0);

const packageSteps: PackageStep[] = [
  {
    step: 1,
    title: '基础感知包',
    modules: [
      { id: 'camera-front', label: '前视相机', type: 'camera', position: 'front', description: '前向 8M 感知' },
      { id: 'camera-rear', label: '后视相机', type: 'camera', position: 'rear', description: '后向辅助感知' }
    ]
  },
  {
    step: 2,
    title: '增强感知包',
    modules: [
      { id: 'radar-front', label: '前毫米波雷达', type: 'radar', position: 'front', description: '高速目标测速' },
      { id: 'radar-rear', label: '后毫米波雷达', type: 'radar', position: 'rear', description: '追尾风险监测' }
    ]
  },
  {
    step: 3,
    title: '高阶感知包',
    modules: [{ id: 'lidar-main', label: '主激光雷达', type: 'lidar', position: 'roof', description: '3D 点云主感知' }]
  },
  {
    step: 4,
    title: '冗余安全包',
    modules: [
      { id: 'backup-lidar', label: '备用激光雷达', type: 'redundant', position: 'roof-rear', description: '关键模块冗余' },
      { id: 'backup-camera', label: '侧向冗余相机', type: 'redundant', position: 'right', description: '盲区安全冗余' }
    ]
  }
];

const activeModules = computed(() =>
  packageSteps
    .filter((item) => item.step <= selectedStep.value)
    .flatMap((item) => item.modules)
);

const currentStepTitle = computed(() => {
  const item = packageSteps.find((step) => step.step === selectedStep.value);
  return item?.title ?? '初始状态（未选配）';
});

const stepHint = computed(() => (selectedStep.value >= 4 ? '已完成全部选配' : '继续点击“向右选配”进入下一阶段'));

const rotation = ref(0);
const isDragging = ref(false);
const dragStartX = ref(0);
const startRotation = ref(0);

const carTransformStyle = computed(() => ({
  transform: `rotateY(${rotation.value}deg)`
}));

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

const normalizeRotation = (deg: number) => {
  const mod = deg % 360;
  return mod >= 0 ? mod : mod + 360;
};

const nextStep = () => {
  if (selectedStep.value < 4) {
    selectedStep.value += 1;
  }
};

const prevStep = () => {
  if (selectedStep.value > 0) {
    selectedStep.value -= 1;
  }
};

const onDragStart = (event: MouseEvent) => {
  isDragging.value = true;
  dragStartX.value = event.clientX;
  startRotation.value = rotation.value;
};

const onDragMove = (event: MouseEvent) => {
  if (!isDragging.value) return;
  const delta = event.clientX - dragStartX.value;
  rotation.value = normalizeRotation(startRotation.value + delta * 0.45);
};

const onDragEnd = () => {
  isDragging.value = false;
};

const onTouchStart = (event: TouchEvent) => {
  const touch = event.touches[0];
  if (!touch) return;
  isDragging.value = true;
  dragStartX.value = touch.clientX;
  startRotation.value = rotation.value;
};

const onTouchMove = (event: TouchEvent) => {
  if (!isDragging.value) return;
  const touch = event.touches[0];
  if (!touch) return;
  const delta = touch.clientX - dragStartX.value;
  rotation.value = normalizeRotation(startRotation.value + delta * 0.45);
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
  padding: 8px 4px;
}

.hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 14px;
  background: radial-gradient(circle at 20% 20%, rgba(84, 126, 255, 0.36), rgba(10, 24, 52, 0.85));
  border: 1px solid rgba(102, 175, 255, 0.45);
}

.hero h3 {
  margin: 0;
  font-size: 18px;
}

.hero p {
  margin: 6px 0 0;
  opacity: 0.9;
}

.stage-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.step-name {
  font-size: 14px;
  font-weight: 600;
}

.step-tip {
  font-size: 13px;
  color: #8bbcff;
}

.stage-indicator {
  padding: 6px 0 2px;
}

.vehicle-stage {
  position: relative;
  overflow: hidden;
  height: 330px;
  border-radius: 16px;
  background: linear-gradient(180deg, #080f22 0%, #05080f 80%);
  border: 1px solid rgba(76, 149, 255, 0.32);
  cursor: grab;
  user-select: none;
}

.vehicle-stage:active {
  cursor: grabbing;
}

.bg-glow {
  position: absolute;
  inset: 18% 20% 45%;
  background: radial-gradient(circle, rgba(66, 147, 255, 0.45) 0%, rgba(66, 147, 255, 0) 72%);
  filter: blur(12px);
}

.ground-reflection {
  position: absolute;
  left: 16%;
  right: 16%;
  bottom: 24px;
  height: 58px;
  background: radial-gradient(ellipse at center, rgba(60, 170, 255, 0.32) 0%, rgba(60, 170, 255, 0) 74%);
  filter: blur(10px);
}

.car-wrap {
  position: absolute;
  width: 520px;
  height: 200px;
  left: 50%;
  top: 50%;
  transform-style: preserve-3d;
  transform-origin: center center;
  translate: -50% -50%;
  transition: transform 0.08s linear;
}

.car-shadow {
  position: absolute;
  left: 100px;
  right: 100px;
  bottom: 18px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  filter: blur(8px);
}

.car-body {
  position: absolute;
  left: 70px;
  right: 70px;
  top: 62px;
  height: 80px;
  border-radius: 70px 88px 48px 48px;
  background: linear-gradient(135deg, #b9c6d8, #77879f 44%, #4f627c 74%, #2a3447);
  box-shadow: inset 0 -12px 16px rgba(6, 10, 20, 0.5), inset 0 10px 14px rgba(255, 255, 255, 0.22);
}

.car-roof {
  position: absolute;
  left: 160px;
  right: 160px;
  top: 42px;
  height: 40px;
  border-radius: 24px 24px 12px 12px;
  background: linear-gradient(120deg, #cad7ea, #8ea2bc 54%, #5f7390);
}

.wheel-arch {
  position: absolute;
  top: 116px;
  width: 96px;
  height: 46px;
  border-radius: 100px 100px 0 0;
  background: rgba(24, 31, 44, 0.9);
}

.wheel-arch.front {
  left: 102px;
}

.wheel-arch.rear {
  right: 102px;
}

.wheel {
  position: absolute;
  top: 130px;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #78869a, #202736 58%, #0d111a);
  border: 4px solid #141b28;
}

.wheel.front {
  left: 114px;
}

.wheel.rear {
  right: 114px;
}

.sensor-module {
  position: absolute;
  min-width: 42px;
  height: 22px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  padding: 0 8px;
  box-shadow: 0 0 14px rgba(130, 187, 255, 0.55);
}

.sensor-module.type-camera {
  background: linear-gradient(135deg, #3db7ff, #2f76ff);
}

.sensor-module.type-radar {
  background: linear-gradient(135deg, #ffbe3d, #ff7a1f);
}

.sensor-module.type-lidar {
  background: linear-gradient(135deg, #ff5c84, #cf2eff);
}

.sensor-module.type-redundant {
  background: linear-gradient(135deg, #44f5c0, #11b99d);
}

.pos-front {
  top: 82px;
  left: 38px;
}

.pos-rear {
  top: 82px;
  right: 38px;
}

.pos-roof {
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
}

.pos-roof-rear {
  top: 22px;
  left: 62%;
}

.pos-left {
  top: 70px;
  left: 145px;
}

.pos-right {
  top: 70px;
  right: 145px;
}

.module-fade-enter-active,
.module-fade-leave-active {
  transition: all 0.26s ease;
}

.module-fade-enter-from,
.module-fade-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.8);
}

@media (max-width: 980px) {
  .hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .stage-header {
    flex-wrap: wrap;
  }

  .car-wrap {
    width: 420px;
  }
}
</style>
