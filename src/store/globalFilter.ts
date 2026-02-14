import { defineStore } from 'pinia';
import { defaultDateRange } from '@/utils/date';

const [start, end] = defaultDateRange();

export const useGlobalFilterStore = defineStore('globalFilter', {
  state: () => ({
    start,
    end,
    siteIds: [] as string[],
    versionIds: [] as string[],
    env: ''
  })
});
