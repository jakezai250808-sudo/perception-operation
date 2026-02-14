<template>
  <div>
    <el-card class="panel" style="margin-bottom: 12px">
      <el-form inline>
        <el-form-item label="关键词"><el-input v-model="query.q" /></el-form-item>
        <el-form-item label="规则"><el-select v-model="query.ruleId" clearable style="width: 160px"><el-option v-for="r in meta.rules" :key="r.id" :value="r.id" :label="r.name" /></el-select></el-form-item>
        <el-form-item label="环境"><el-select v-model="query.env" clearable style="width: 120px"><el-option value="blue" label="blue" /><el-option value="green" label="green" /></el-select></el-form-item>
        <el-button type="primary" @click="$emit('apply')">检索</el-button>
        <el-button @click="saveCurrentQuery">保存查询</el-button>
        <el-button @click="exportList">导出CSV</el-button>
      </el-form>
    </el-card>
    <ErrorState v-if="error" :message="error" />
    <el-table v-else :data="list" v-loading="loading" @sort-change="onSortChange">
      <el-table-column prop="timestamp" label="时间" sortable="custom" />
      <el-table-column prop="siteName" label="局点" />
      <el-table-column prop="env" label="环境" />
      <el-table-column prop="versionLabel" label="版本" />
      <el-table-column prop="ruleId" label="ruleId" />
      <el-table-column prop="ruleName" label="ruleName" />
      <el-table-column prop="severity" label="severity" />
      <el-table-column prop="count" label="count" />
      <el-table-column prop="sourceModule" label="sourceModule" />
      <el-table-column prop="message" label="message" show-overflow-tooltip />
      <el-table-column label="操作">
        <template #default="{ row }"><el-button link type="primary" @click="$emit('go-detail', row.id)">详情</el-button></template>
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
import { useRoute } from 'vue-router';
import type { EventsQuery, EventRecord } from '@/types';
import type { Rule } from '@/types';
import { exportToCsv } from '@/utils/csv';
import { saveEventQuery } from '@/utils/queryPersistence';
import ErrorState from '@/components/ErrorState.vue';

const route = useRoute();
const emit = defineEmits<{ apply: []; 'go-detail': [string] }>();

const props = defineProps<{
  query: EventsQuery;
  meta: { rules: Rule[] };
  list: EventRecord[];
  loading: boolean;
  error: string;
  total: number;
}>();

const onSortChange = ({ prop, order }: { prop: string; order: 'ascending' | 'descending' | null }) => {
  props.query.sort = order ? `${prop}:${order === 'ascending' ? 'asc' : 'desc'}` : '';
  emit('apply');
};

const exportList = () => exportToCsv('events.csv', props.list);

const saveCurrentQuery = () => {
  const name = window.prompt('请输入事件查询名称');
  if (!name) return;
  saveEventQuery({ name, query: route.query as Record<string, string> });
};
</script>
