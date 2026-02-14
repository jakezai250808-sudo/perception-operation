<template>
  <div class="page-container">
    <PointCloudViewer :visible="true" :event-id="String(route.params.id)" @close="back" />
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import PointCloudViewer from './components/PointCloudViewer.vue';

const route = useRoute();
const router = useRouter();

const back = () => {
  router.push({ path: '/events', query: { ...route.query, tab: 'map' } });
};
</script>
