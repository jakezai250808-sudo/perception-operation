<template>
  <el-drawer :model-value="visible" title="事件详情" size="420px" @close="$emit('close')">
    <el-descriptions :column="1" border v-if="event">
      <el-descriptions-item label="ID">{{ event.id }}</el-descriptions-item>
      <el-descriptions-item label="时间">{{ event.ts }}</el-descriptions-item>
      <el-descriptions-item label="局点">{{ event.siteId }}</el-descriptions-item>
      <el-descriptions-item label="版本">{{ event.version }}</el-descriptions-item>
      <el-descriptions-item label="环境">{{ event.env }}</el-descriptions-item>
      <el-descriptions-item label="规则">{{ event.ruleId }}</el-descriptions-item>
      <el-descriptions-item label="严重级别">{{ event.severity }}</el-descriptions-item>
      <el-descriptions-item label="message">{{ event.message }}</el-descriptions-item>
      <el-descriptions-item label="position">x={{ event.position.world.x.toFixed(1) }}, y={{ event.position.world.y.toFixed(1) }}</el-descriptions-item>
    </el-descriptions>
    <el-space style="margin-top: 12px">
      <el-button type="primary" @click="$emit('open-detail')">打开完整事件详情页</el-button>
      <el-button @click="$emit('open-pcd')">打开点云（PCD）</el-button>
    </el-space>
  </el-drawer>
</template>

<script setup lang="ts">
import type { GeoEvent } from '@/types';
defineProps<{ visible: boolean; event: GeoEvent | null }>();
defineEmits<{ close: []; 'open-detail': []; 'open-pcd': [] }>();
</script>
