<template>
  <el-sub-menu v-if="item.children?.length" :index="item.key">
    <template #title>
      <el-tooltip :content="item.label" placement="right" :disabled="!collapsed">
        <span style="display: inline-flex; align-items: center; gap: 8px">
          <span>{{ item.icon }}</span>
          <span v-if="!collapsed">{{ item.label }}</span>
        </span>
      </el-tooltip>
    </template>
    <SidebarItem
      v-for="child in item.children"
      :key="child.key"
      :item="child"
      :collapsed="collapsed"
      @navigate="emit('navigate', $event)"
    />
  </el-sub-menu>

  <el-tooltip v-else :content="item.label" placement="right" :disabled="!collapsed">
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
