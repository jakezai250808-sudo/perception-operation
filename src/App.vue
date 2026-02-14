<template>
  <el-container class="app-shell">
    <el-header class="app-header" style="display: flex; align-items: center; justify-content: space-between">
      <div class="brand-block">
        <span class="brand-title">自动驾驶运营可观测对比分析平台 V1</span>
        <span class="brand-subtitle">Operations Observability · Internal Console</span>
      </div>
      <el-tag type="primary" effect="dark" round>Enterprise View</el-tag>
    </el-header>
    <el-container>
      <el-aside class="app-sidebar" width="220px">
        <el-menu :router="true" :default-active="route.path" background-color="transparent" text-color="#dbe7ff" active-text-color="#dbe7ff">
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

const route = useRoute();
</script>
