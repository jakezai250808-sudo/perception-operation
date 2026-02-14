<template>
  <el-tooltip :content="item.label" placement="right" :disabled="!collapsed">
    <el-menu-item :index="item.key" @click="onClick">
      <span style="margin-right: 8px">{{ item.icon }}</span>
      <span v-if="!collapsed">{{ item.label }}</span>
    </el-menu-item>
  </el-tooltip>
</template>

<script setup lang="ts">
import type { MenuItem } from '@/config/menu';

const props = defineProps<{ item: MenuItem; collapsed: boolean }>();
const emit = defineEmits<{ navigate: [string] }>();

const onClick = () => {
  if (props.item.path) emit('navigate', props.item.path);
};
</script>
