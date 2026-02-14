<template>
  <el-container class="app-shell">
    <el-header class="app-header" style="display: flex; align-items: center; justify-content: space-between">
      <div style="display: flex; align-items: center; gap: 10px">
        <el-button v-if="app.isMobile" text @click="app.setDrawerVisible(true)">☰</el-button>
        <div class="brand-block">
          <span class="brand-title">自动驾驶运营可观测对比分析平台 V1</span>
          <span class="brand-subtitle">Operations Observability · Internal Console</span>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 10px">
        <el-segmented
          v-model="theme"
          :options="[
            { label: '深色', value: 'dark' },
            { label: '浅色', value: 'light' }
          ]"
        />
        <el-tag type="primary" effect="dark" round>Enterprise View</el-tag>
      </div>
    </el-header>

    <el-container>
      <el-aside v-if="!app.isMobile" class="app-sidebar" :width="app.sidebarCollapsed ? '64px' : '220px'">
        <Sidebar />
      </el-aside>
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>

    <el-drawer v-model="app.drawerVisible" direction="ltr" size="220px" :with-header="false">
      <Sidebar />
    </el-drawer>
  </el-container>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import Sidebar from './components/Sidebar.vue';
import { useTheme } from '@/composables/useTheme';
import { useAppStore } from '@/store/app';

const { theme } = useTheme();
const app = useAppStore();

const onResize = () => {
  app.setMobile(window.innerWidth < 1024);
};

onMounted(() => {
  onResize();
  window.addEventListener('resize', onResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
});
</script>
