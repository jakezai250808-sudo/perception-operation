<template>
  <el-card class="panel" style="margin-bottom: 12px">
    <el-form inline>
      <el-form-item label="局点">
        <el-select v-model="query.siteId" style="width: 180px">
          <el-option v-for="s in sites" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="时间">
        <el-date-picker v-model="timeRange" type="datetimerange" value-format="YYYY-MM-DDTHH:mm:ss[Z]" style="width: 360px" />
      </el-form-item>
      <el-form-item label="环境">
        <el-select v-model="query.env" style="width: 120px">
          <el-option label="all" value="all" />
          <el-option label="blue" value="blue" />
          <el-option label="green" value="green" />
        </el-select>
      </el-form-item>
      <el-form-item label="版本">
        <el-select v-model="query.versionIds" multiple collapse-tags style="width: 200px">
          <el-option v-for="v in versions" :key="v.id" :value="v.id" :label="v.label" />
        </el-select>
      </el-form-item>
      <el-form-item label="严重级别">
        <el-select v-model="query.severity" multiple collapse-tags style="width: 160px">
          <el-option value="P0" label="P0" /><el-option value="P1" label="P1" /><el-option value="P2" label="P2" /><el-option value="P3" label="P3" />
        </el-select>
      </el-form-item>
      <el-form-item label="规则">
        <el-select v-model="query.ruleId" clearable style="width: 140px">
          <el-option v-for="r in rules" :key="r.id" :value="r.id" :label="r.name" />
        </el-select>
      </el-form-item>
      <el-form-item label="关键词"><el-input v-model="query.q" /></el-form-item>
      <el-button type="primary" @click="$emit('search')">应用</el-button>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { MapQuery } from '../hooks/useMapQuery';
import type { Rule, Site, Version } from '@/types';

const query = defineModel<MapQuery>({ required: true });
defineProps<{ sites: Site[]; versions: Version[]; rules: Rule[] }>();
defineEmits<{ search: [] }>();

const timeRange = computed({
  get: () => [query.value.start, query.value.end],
  set: (v) => {
    query.value.start = v?.[0] ?? '';
    query.value.end = v?.[1] ?? '';
  }
});
</script>
