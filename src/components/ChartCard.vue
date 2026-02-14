<template>
  <el-card class="panel" style="margin-bottom: 12px">
    <template #header>
      <div style="display: flex; justify-content: space-between; align-items: center">
        <span class="chart-title">{{ title }}</span>
        <slot name="actions" />
      </div>
    </template>
    <slot />
  </el-card>
</template>

<script setup lang="ts">
defineProps<{ title: string }>();
</script>
