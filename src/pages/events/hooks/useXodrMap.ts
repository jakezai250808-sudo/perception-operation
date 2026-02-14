import { ref } from 'vue';
import { getXodr } from '@/api/maps';

export function useXodrMap() {
  const loading = ref(false);
  const error = ref('');
  const polylines = ref<Array<Array<[number, number]>>>([]);

  const load = async (siteId: string) => {
    loading.value = true;
    try {
      const res = await getXodr(siteId);
      polylines.value = res.polylines;
      error.value = '';
    } catch (e) {
      error.value = (e as Error).message;
    } finally {
      loading.value = false;
    }
  };

  return { loading, error, polylines, load };
}
