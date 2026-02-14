<template>
  <div>
    <el-card class="panel" style="margin-bottom: 12px">
      <el-form inline>
        <el-form-item label="创建时间">
          <el-date-picker v-model="createdRange" type="daterange" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="局点">
          <el-select v-model="query.siteIds" multiple collapse-tags style="width: 200px">
            <el-option v-for="s in meta.sites" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="版本">
          <el-select v-model="query.versionIds" multiple collapse-tags style="width: 200px">
            <el-option v-for="v in meta.versions" :key="v.id" :label="v.label" :value="v.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="环境">
          <el-select v-model="query.env" clearable style="width: 120px"><el-option value="blue" label="blue" /><el-option value="green" label="green" /></el-select>
        </el-form-item>
        <el-form-item label="严重级别">
          <el-select v-model="query.severity" clearable style="width: 120px"><el-option value="P0" label="P0" /><el-option value="P1" label="P1" /><el-option value="P2" label="P2" /><el-option value="P3" label="P3" /></el-select>
        </el-form-item>
        <el-form-item label="规则"><el-select v-model="query.ruleId" clearable style="width: 140px"><el-option v-for="r in meta.rules" :key="r.id" :label="r.name" :value="r.id" /></el-select></el-form-item>
        <el-form-item label="创建人"><el-input v-model="query.createdBy" /></el-form-item>
        <el-form-item label="关键词"><el-input v-model="query.q" placeholder="名称/ID" /></el-form-item>
        <el-button type="primary" @click="$emit('apply')">检索</el-button>
        <el-button @click="reset">重置筛选</el-button>
        <el-button @click="saveCurrentQuery">保存查询</el-button>
      </el-form>
    </el-card>

    <ErrorState v-if="error" :message="error" />
    <el-table v-else :data="list" v-loading="loading">
      <el-table-column prop="createdAt" label="createdAt" width="180" />
      <el-table-column prop="name" label="name" min-width="240" />
      <el-table-column label="scope" min-width="180">
        <template #default="{ row }">
          site={{ row.filters.siteIds?.length || 0 }}, version={{ row.filters.versionIds?.length || 0 }}, env={{ row.filters.env || 'all' }}
        </template>
      </el-table-column>
      <el-table-column label="eventCount" width="120"><template #default="{ row }">{{ row.summary.eventCount }}</template></el-table-column>
      <el-table-column label="anomalyScore" width="130"><template #default="{ row }">{{ row.summary.anomalyScore }}</template></el-table-column>
      <el-table-column label="trigger描述" min-width="260">
        <template #default="{ row }">{{ getTriggerDescription(row) }}</template>
      </el-table-column>
      <el-table-column prop="status" label="status" width="120" />
      <el-table-column label="操作" width="280">
        <template #default="{ row }">
          <el-button link type="primary" @click="$emit('view', row.id)">查看</el-button>
          <el-tooltip v-if="row.status !== 'ready'" :content="row.status === 'processing' ? '快照生成中' : '快照已过期'">
            <span><el-button link disabled>下载详细</el-button></span>
          </el-tooltip>
          <el-button v-else link :loading="downloadingMap[row.id]" @click="$emit('download', row.id, 'csv')">下载详细</el-button>
          <el-button link @click="copyLink(row.id)">复制链接</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      style="margin-top: 12px"
      layout="total, prev, pager, next, sizes"
      v-model:current-page="query.page"
      v-model:page-size="query.pageSize"
      :total="total"
      @change="$emit('apply')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import type { Rule, Site, SnapshotQuery, SnapshotRecord, Version } from '@/types';
import { defaultDateRange } from '@/utils/date';
import { saveSnapshotQuery } from '@/utils/queryPersistence';
import ErrorState from '@/components/ErrorState.vue';

const props = defineProps<{
  query: SnapshotQuery;
  list: SnapshotRecord[];
  loading: boolean;
  error: string;
  total: number;
  meta: { sites: Site[]; versions: Version[]; rules: Rule[] };
  downloadingMap: Record<string, boolean>;
}>();

defineEmits<{ apply: []; view: [string]; download: [string, 'csv' | 'json'] }>();
const route = useRoute();

const createdRange = computed({
  get: () => [props.query.createdStart ?? '', props.query.createdEnd ?? ''],
  set: (v) => {
    props.query.createdStart = v?.[0] ?? '';
    props.query.createdEnd = v?.[1] ?? '';
  }
});

const getTriggerDescription = (row: SnapshotRecord) => {
  const payload = row.result?.json;
  let data: unknown = payload;
  if (typeof payload === 'string') {
    try {
      data = JSON.parse(payload || '{}');
    } catch {
      data = {};
    }
  }
  const trigger = (data as { trigger?: unknown } | undefined)?.trigger;
  return typeof trigger === 'string' && trigger.trim() ? trigger : '-';
};

const reset = () => {
  const [start, end] = defaultDateRange();
  props.query.createdStart = start;
  props.query.createdEnd = end;
  props.query.siteIds = [];
  props.query.versionIds = [];
  props.query.env = '';
  props.query.severity = '';
  props.query.ruleId = '';
  props.query.createdBy = '';
  props.query.q = '';
};

const saveCurrentQuery = () => {
  const name = window.prompt('请输入快照查询名称');
  if (!name) return;
  saveSnapshotQuery({ name, query: route.query as Record<string, string> });
};

const copyLink = async (id: string) => {
  const url = `${window.location.origin}/events/snapshots/${id}`;
  await navigator.clipboard.writeText(url);
};
</script>
