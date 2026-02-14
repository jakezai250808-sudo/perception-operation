import { ref } from 'vue';
import { getCompareData } from '@/api/endpoints';
import type { CompareResponse } from '@/types';

export function useCompareData() {
  const loading = ref(false);
  const error = ref('');
  const data = ref<CompareResponse | null>(null);

  const load = async (params: Record<string, string>) => {
    loading.value = true;
    try {
      data.value = await getCompareData(params);
      error.value = '';
    } catch (e) {
      error.value = (e as Error).message;
    } finally {
      loading.value = false;
    }
  };

  return { loading, error, data, load };
}
