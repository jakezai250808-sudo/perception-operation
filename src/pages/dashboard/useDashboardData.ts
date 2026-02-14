import { ref } from 'vue';
import { getDashboardSummary } from '@/api/endpoints';
import type { DashboardSummary } from '@/types';

export function useDashboardData() {
  const loading = ref(false);
  const error = ref('');
  const data = ref<DashboardSummary | null>(null);

  const load = async (params: Record<string, string>) => {
    loading.value = true;
    error.value = '';
    try {
      data.value = await getDashboardSummary(params);
    } catch (e) {
      error.value = (e as Error).message;
    } finally {
      loading.value = false;
    }
  };

  return { loading, error, data, load };
}
