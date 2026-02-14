import { reactive, ref } from 'vue';
import { buildSnapshotParams, getSnapshots } from '@/api/endpoints';
import type { SnapshotQuery, SnapshotRecord } from '@/types';

export function useSnapshotsQuery(initial: SnapshotQuery) {
  const query = reactive<SnapshotQuery>({ ...initial });
  const loading = ref(false);
  const error = ref('');
  const list = ref<SnapshotRecord[]>([]);
  const total = ref(0);

  const search = async () => {
    loading.value = true;
    try {
      const res = await getSnapshots(buildSnapshotParams(query));
      list.value = res.items;
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
