import { createRouter, createWebHistory } from 'vue-router';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/dashboard' },
    { path: '/dashboard', component: () => import('@/pages/dashboard/DashboardPage.vue') },
    { path: '/compare', component: () => import('@/pages/compare/ComparePage.vue') },
    { path: '/events', component: () => import('@/pages/events/EventsPage.vue') },
    { path: '/events/:id', component: () => import('@/pages/event-detail/EventDetailPage.vue') },
    { path: '/:pathMatch(.*)*', component: () => import('@/pages/NotFoundPage.vue') }
  ]
});
