<template>
  <el-result icon="error" title="加载失败" :sub-title="message" />
</template>

<script setup lang="ts">
defineProps<{ message: string }>();
</script>
