<template>
  <el-container class="app-shell">
    <el-header class="app-header" style="display: flex; align-items: center; justify-content: space-between">
      <div class="brand-block">
        <span class="brand-title">自动驾驶运营可观测对比分析平台 V1</span>
        <span class="brand-subtitle">Operations Observability · Internal Console</span>
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
      <el-aside class="app-sidebar" width="220px">
        <el-menu :router="true" :default-active="route.path" background-color="transparent" text-color="var(--menu-text)" active-text-color="var(--menu-active-text)">
          <el-menu-item index="/dashboard">Dashboard</el-menu-item>
          <el-menu-item index="/compare">Compare</el-menu-item>
          <el-menu-item index="/events">Events</el-menu-item>
        </el-menu>
      </el-aside>
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useTheme } from '@/composables/useTheme';

const route = useRoute();
const { theme } = useTheme();
</script>
