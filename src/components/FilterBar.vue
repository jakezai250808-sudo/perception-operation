<template>
  <el-card class="panel" style="margin-bottom: 12px">
    <el-form inline>
      <el-form-item label="时间">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          start-placeholder="开始"
          end-placeholder="结束"
        />
      </el-form-item>
      <el-form-item label="局点">
        <el-select v-model="model.siteIds" multiple collapse-tags collapse-tags-tooltip style="width: 220px">
          <el-option v-for="s in sites" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="版本">
        <el-select v-model="model.versionIds" multiple collapse-tags collapse-tags-tooltip style="width: 220px">
          <el-option v-for="v in versions" :key="v.id" :label="v.label" :value="v.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="环境">
        <el-select v-model="model.env" style="width: 120px">
          <el-option label="全部" value="" />
          <el-option label="Blue" value="blue" />
          <el-option label="Green" value="green" />
        </el-select>
      </el-form-item>
      <el-button type="primary" @click="$emit('search')">应用筛选</el-button>
      <el-button @click="reset">重置</el-button>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Site, Version } from '@/types';
import { defaultDateRange } from '@/utils/date';

const model = defineModel<{ start: string; end: string; siteIds: string[]; versionIds: string[]; env: string }>({
  required: true
});

defineProps<{ sites: Site[]; versions: Version[] }>();
defineEmits<{ search: [] }>();

const dateRange = computed({
  get: () => [model.value.start, model.value.end],
  set: (range) => {
    model.value.start = range?.[0] ?? '';
    model.value.end = range?.[1] ?? '';
  }
});

const reset = () => {
  const [start, end] = defaultDateRange();
  model.value.start = start;
  model.value.end = end;
  model.value.siteIds = [];
  model.value.versionIds = [];
  model.value.env = '';
};
</script>
