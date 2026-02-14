<template>
  <aside class="sidebar" :class="{ collapsed }">
    <div class="logo-box">
      <span class="logo-mark">🚘</span>
      <span v-if="!collapsed" class="logo-text">运营可观测平台</span>
    </div>

    <el-menu :default-active="activeKey" class="sidebar-menu" :collapse="collapsed" unique-opened>
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
import type { MenuItem } from '@/config/menu';
import { useAppStore } from '@/store/app';
import SidebarItem from './SidebarItem.vue';

const app = useAppStore();
const route = useRoute();
const router = useRouter();

const collapsed = computed(() => app.sidebarCollapsed);

const activeKey = computed(() => {
  if (route.meta.activeMenu) return String(route.meta.activeMenu);
  if (route.path === '/events') {
    return route.query.tab === 'snapshots' ? '/events/snapshots' : '/events/list';
  }
  return route.path;
});

const filterMenuByRole = (items: MenuItem[]): MenuItem[] =>
  items
    .filter((item) => !item.hidden && (!item.roles?.length || item.roles.includes(app.role)))
    .map((item) => ({
      ...item,
      children: item.children ? filterMenuByRole(item.children) : undefined
    }));

const visibleMenus = computed(() => filterMenuByRole(menuSchema));

const toggle = () => app.toggleSidebar();

const navigate = async (path: string) => {
  if (path.includes('?')) {
    const [pathname, search] = path.split('?');
    const query = Object.fromEntries(new URLSearchParams(search).entries());
    await router.push({ path: pathname, query: { ...route.query, ...query } });
  } else {
    await router.push({ path, query: route.query });
  }
  if (app.isMobile) app.setDrawerVisible(false);
};
</script>
