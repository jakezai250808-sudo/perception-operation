import { reactive } from 'vue';
import dayjs from 'dayjs';
import type { Severity } from '@/types';

export interface MapQuery {
  siteId: string;
  start: string;
  end: string;
  env: 'blue' | 'green' | 'all';
  versionIds: string[];
  severity: Severity[];
  ruleId: string;
  q: string;
  zoom: number;
  centerX: number;
  centerY: number;
}

export function useMapQuery(routeQuery: Record<string, unknown>, defaultSiteId: string) {
  const query = reactive<MapQuery>({
    siteId: String(routeQuery.map_siteId ?? defaultSiteId),
    start: String(routeQuery.map_start ?? dayjs().subtract(1, 'day').toISOString()),
    end: String(routeQuery.map_end ?? dayjs().toISOString()),
    env: (routeQuery.map_env as MapQuery['env']) || 'all',
    versionIds: String(routeQuery.map_versionIds ?? '').split(',').filter(Boolean),
    severity: String(routeQuery.map_severity ?? '')
      .split(',')
      .filter(Boolean) as Severity[],
    ruleId: String(routeQuery.map_ruleId ?? ''),
    q: String(routeQuery.map_q ?? ''),
    zoom: Number(routeQuery.map_zoom ?? 1),
    centerX: Number(routeQuery.map_cx ?? 0),
    centerY: Number(routeQuery.map_cy ?? 0)
  });

  const toRouteQuery = () => ({
    map_siteId: query.siteId,
    map_start: query.start,
    map_end: query.end,
    map_env: query.env,
    map_versionIds: query.versionIds.join(','),
    map_severity: query.severity.join(','),
    map_ruleId: query.ruleId,
    map_q: query.q,
    map_zoom: String(query.zoom),
    map_cx: String(query.centerX),
    map_cy: String(query.centerY)
  });

  return { query, toRouteQuery };
}
