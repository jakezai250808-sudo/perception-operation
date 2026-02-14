import { ref } from 'vue';
import { listGeoEvents } from '@/api/eventsGeo';
import type { GeoEvent } from '@/types';

export function useGeoEvents() {
  const loading = ref(false);
  const error = ref('');
  const items = ref<GeoEvent[]>([]);

  const load = async (params: Record<string, string | number>) => {
    loading.value = true;
    try {
      const res = await listGeoEvents(params);
      items.value = res.items;
      error.value = '';
    } catch (e) {
      error.value = (e as Error).message;
    } finally {
      loading.value = false;
    }
  };

  return { loading, error, items, load };
}
