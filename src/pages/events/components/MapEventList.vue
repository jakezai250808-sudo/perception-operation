<template>
  <el-card class="panel" style="height: 100%">
    <template #header>
      <div style="display:flex;justify-content:space-between">
        <span>事件列表 ({{ events.length }})</span>
        <el-button text @click="$emit('toggle-collapse')">{{ collapsed ? '展开' : '收起' }}</el-button>
      </div>
    </template>
    <div v-if="!collapsed" style="max-height: calc(100vh - 280px); overflow: auto">
      <div
        v-for="item in events"
        :key="item.id"
        :style="{padding:'8px',cursor:'pointer',borderBottom:'1px solid var(--border-soft)',background:selectedId===item.id?'var(--brand-soft)':'transparent'}"
        @click="$emit('select', item)"
      >
        <div><strong>{{ item.id }}</strong> · {{ item.severity }}</div>
        <div style="color:var(--text-secondary)">{{ item.ruleId }} · {{ item.message }}</div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import type { GeoEvent } from '@/types';
defineProps<{ events: GeoEvent[]; selectedId?: string; collapsed: boolean }>();
defineEmits<{ select: [GeoEvent]; 'toggle-collapse': [] }>();
</script>
