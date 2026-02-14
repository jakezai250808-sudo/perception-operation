import { defineStore } from 'pinia';
import { getStorage, setStorage } from '@/utils/storage';

const COLLAPSED_KEY = 'sidebar_collapsed';

export const useAppStore = defineStore('app', {
  state: () => ({
    sidebarCollapsed: getStorage<boolean>(COLLAPSED_KEY, false),
    isMobile: window.innerWidth < 1024,
    drawerVisible: false,
    role: 'ops' as 'ops' | 'admin'
  }),
  actions: {
    setSidebarCollapsed(collapsed: boolean) {
      this.sidebarCollapsed = collapsed;
      setStorage(COLLAPSED_KEY, collapsed);
    },
    toggleSidebar() {
      this.setSidebarCollapsed(!this.sidebarCollapsed);
    },
    setMobile(flag: boolean) {
      this.isMobile = flag;
      if (!flag) this.drawerVisible = false;
    },
    setDrawerVisible(flag: boolean) {
      this.drawerVisible = flag;
    }
  }
});
