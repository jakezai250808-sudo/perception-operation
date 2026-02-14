<template>
  <aside class="sidebar" :class="{ collapsed }">
    <div class="logo-box">
      <span class="logo-mark">🚘</span>
      <span v-if="!collapsed" class="logo-text">运营可观测平台</span>
    </div>

    <el-menu :default-active="activeKey" class="sidebar-menu">
      <SidebarItem
        v-for="item in visibleMenus"
        :key="item.key"
        :item="item"
        :collapsed="collapsed"
        @navigate="navigate"
      />
    </el-menu>

    <el-button class="collapse-btn" text @click="toggle" aria-label="折叠或展开侧边栏">
      {{ collapsed ? '» 展开' : '« 折叠' }}
    </el-button>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { menuSchema } from '@/config/menu';
import { useAppStore } from '@/store/app';
import SidebarItem from './SidebarItem.vue';

const app = useAppStore();
const route = useRoute();
const router = useRouter();

const collapsed = computed(() => app.sidebarCollapsed);
const activeKey = computed(() => (route.meta.activeMenu as string) || route.path);

const visibleMenus = computed(() =>
  menuSchema.filter((item) => !item.hidden && (!item.roles?.length || item.roles.includes(app.role)))
);

const toggle = () => app.toggleSidebar();

const navigate = async (path: string) => {
  await router.push({ path, query: route.query });
  if (app.isMobile) app.setDrawerVisible(false);
};
</script>
