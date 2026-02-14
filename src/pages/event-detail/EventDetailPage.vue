<template>
  <div class="page-container">
    <el-page-header @back="router.push({ path: '/events', query: route.query })" title="返回列表" />
    <el-skeleton :loading="loading" animated>
      <ErrorState v-if="error" :message="error" />
      <template v-else-if="detail">
        <el-card class="panel" style="margin-top: 12px">
          <template #header>
            <div style="display: flex; justify-content: space-between">
              <span>事件详情 {{ detail.id }}</span>
              <div>
                <el-button size="small" @click="copy(detail.id)">复制事件ID</el-button>
                <el-button size="small" @click="copy(window.location.href)">复制过滤链接</el-button>
              </div>
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="时间">{{ detail.timestamp }}</el-descriptions-item>
            <el-descriptions-item label="局点">{{ detail.siteName }}</el-descriptions-item>
            <el-descriptions-item label="环境">{{ detail.env }}</el-descriptions-item>
            <el-descriptions-item label="版本">{{ detail.versionLabel }}</el-descriptions-item>
            <el-descriptions-item label="规则">{{ detail.ruleName }}({{ detail.ruleId }})</el-descriptions-item>
            <el-descriptions-item label="severity">{{ detail.severity }}</el-descriptions-item>
            <el-descriptions-item label="模块">{{ detail.sourceModule }}</el-descriptions-item>
            <el-descriptions-item label="消息">{{ detail.message }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
        <el-row :gutter="12" style="margin-top: 12px">
          <el-col :span="12">
            <ChartCard title="同规则近1小时趋势">
              <VChart :option="trendOption" style="height: 260px" autoresize />
            </ChartCard>
          </el-col>
          <el-col :span="12">
            <ChartCard title="同局点近1小时Top规则">
              <el-table :data="detail.siteTopRules"><el-table-column prop="ruleName" label="规则" /><el-table-column prop="count" label="count" /></el-table>
            </ChartCard>
          </el-col>
        </el-row>
      </template>
    </el-skeleton>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getEventDetail } from '@/api/endpoints';
import ChartCard from '@/components/ChartCard.vue';
import ErrorState from '@/components/ErrorState.vue';
import { lineOption } from '@/utils/chartOptions';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const error = ref('');
const detail = ref<any>(null);

const load = async () => {
  loading.value = true;
  try {
    detail.value = await getEventDetail(String(route.params.id));
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
};

const trendOption = computed(() =>
  lineOption(
    detail.value?.sameRuleTrend.map((i: { time: string }) => i.time) ?? [],
    [{ name: 'count', data: detail.value?.sameRuleTrend.map((i: { count: number }) => i.count) ?? [] }]
  )
);

const copy = async (text: string) => navigator.clipboard.writeText(text);

onMounted(load);
</script>
