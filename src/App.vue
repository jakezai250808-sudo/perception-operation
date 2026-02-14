<template>
  <el-container style="height: 100vh">
    <el-header style="display: flex; align-items: center; justify-content: space-between">
      <strong>自动驾驶运营可观测对比分析平台 V1</strong>
    </el-header>
    <el-container>
      <el-aside width="220px">
        <el-menu :router="true" :default-active="route.path" background-color="#111827" text-color="#fff">
          <el-menu-item index="/dashboard">Dashboard</el-menu-item>
          <el-menu-item index="/compare">Compare</el-menu-item>
          <el-menu-item index="/events">Events</el-menu-item>
        </el-menu>
      </el-aside>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();
</script>
