import { reactive, ref } from 'vue';
import { buildEventsParams, getEvents } from '@/api/endpoints';
import type { EventRecord, EventsQuery } from '@/types';

export function useEventsQuery(initial: EventsQuery) {
  const query = reactive<EventsQuery>({ ...initial });
  const loading = ref(false);
  const error = ref('');
  const list = ref<EventRecord[]>([]);
  const total = ref(0);

  const search = async () => {
    loading.value = true;
    try {
      const res = await getEvents(buildEventsParams(query));
      list.value = res.list;
      total.value = res.total;
      error.value = '';
    } catch (e) {
      error.value = (e as Error).message;
    } finally {
      loading.value = false;
    }
  };

  return { query, loading, error, list, total, search };
}
