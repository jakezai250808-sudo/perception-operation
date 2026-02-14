import { createRouter, createWebHistory } from 'vue-router';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('@/layout/AppLayout.vue'),
      children: [
        { path: '', redirect: '/dashboard' },
        { path: 'dashboard', component: () => import('@/pages/dashboard/DashboardPage.vue') },
        { path: 'compare', component: () => import('@/pages/compare/ComparePage.vue') },
        { path: 'events', component: () => import('@/pages/events/EventsPage.vue') },
        {
          path: 'events/snapshots/:id',
          component: () => import('@/pages/events/SnapshotDetailPage.vue'),
          meta: { activeMenu: '/events' }
        },
        {
          path: 'events/:id',
          component: () => import('@/pages/event-detail/EventDetailPage.vue'),
          meta: { activeMenu: '/events' }
        }
      ]
    },
    { path: '/:pathMatch(.*)*', component: () => import('@/pages/NotFoundPage.vue') }
  ]
});
