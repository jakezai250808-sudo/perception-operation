import dayjs from 'dayjs';
import type { AxiosRequestConfig } from 'axios';
import type { CompareResponse, DashboardSummary, EventRecord, EventsQuery, SnapshotQuery } from '@/types';
import {
  allEvents,
  anomalyScore,
  getSnapshotDetail,
  getSnapshotEvents,
  rules,
  sites,
  snapshots,
  versions
} from './data';

const toArr = (v?: string | string[]) => (Array.isArray(v) ? v : v ? v.split(',').filter(Boolean) : []);

function readParams(config: AxiosRequestConfig): URLSearchParams {
  const raw = config.url?.split('?')[1] ?? '';
  return new URLSearchParams(raw);
}

function filterEvents(params: EventsQuery): EventRecord[] {
  return allEvents.filter((event) => {
    if (params.start && dayjs(event.timestamp).isBefore(dayjs(params.start))) return false;
    if (params.end && dayjs(event.timestamp).isAfter(dayjs(params.end))) return false;
    if (params.siteIds?.length && !params.siteIds.includes(event.siteId)) return false;
    if (params.versionIds?.length && !params.versionIds.includes(event.versionId)) return false;
    if (params.env && event.env !== params.env) return false;
    if (params.severity && event.severity !== params.severity) return false;
    if (params.ruleId && event.ruleId !== params.ruleId) return false;
    if (params.q && !`${event.ruleName}${event.message}`.includes(params.q)) return false;
    return true;
  });
}

export const handlers = {
  '/api/meta/sites': () => [200, sites],
  '/api/meta/versions': () => [200, versions],
  '/api/meta/rules': () => [200, rules],
  '/api/dashboard/summary': (config: AxiosRequestConfig) => {
    const params = readParams(config);
    const list = filterEvents({
      start: params.get('start') ?? undefined,
      end: params.get('end') ?? undefined,
      siteIds: toArr(params.get('siteIds') ?? undefined),
      versionIds: toArr(params.get('versionIds') ?? undefined),
      env: (params.get('env') as EventsQuery['env']) ?? ''
    });

    const trendMap = new Map<string, { total: number; blue: number; green: number }>();
    list.forEach((e) => {
      const key = dayjs(e.timestamp).format('YYYY-MM-DD');
      const prev = trendMap.get(key) ?? { total: 0, blue: 0, green: 0 };
      prev.total += e.count;
      prev[e.env] += e.count;
      trendMap.set(key, prev);
    });

    const topRules = Object.values(
      list.reduce<Record<string, { ruleName: string; count: number }>>((acc, e) => {
        acc[e.ruleId] = acc[e.ruleId] ?? { ruleName: e.ruleName, count: 0 };
        acc[e.ruleId].count += e.count;
        return acc;
      }, {})
    )
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const siteHealth = sites
      .map((site) => {
        const siteEvents = list.filter((e) => e.siteId === site.id);
        const count = siteEvents.reduce((sum, e) => sum + e.count, 0);
        const baseline = allEvents
          .filter((e) => e.siteId === site.id && dayjs(e.timestamp).isAfter(dayjs().subtract(14, 'day')))
          .reduce((sum, e) => sum + e.count, 0) / 2;
        return { siteName: site.name, eventCount: count, anomalyScore: anomalyScore(count, baseline) };
      })
      .sort((a, b) => b.anomalyScore - a.anomalyScore);

    const versionAnomaly = versions
      .map((version) => {
        const versionEvents = list.filter((e) => e.versionId === version.id);
        const count = versionEvents.reduce((sum, e) => sum + e.count, 0);
        const baseline =
          allEvents
            .filter((e) => e.versionId === version.id && dayjs(e.timestamp).isAfter(dayjs().subtract(14, 'day')))
            .reduce((sum, e) => sum + e.count, 0) / 2;
        return {
          versionLabel: version.label,
          eventCount: count,
          anomalyScore: anomalyScore(count, baseline)
        };
      })
      .sort((a, b) => b.anomalyScore - a.anomalyScore);

    const summary: DashboardSummary = {
      trend: Array.from(trendMap.entries())
        .map(([date, values]) => ({ date, ...values }))
        .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf()),
      topRules,
      siteHealth,
      versionAnomaly
    };

    return [200, summary];
  },
  '/api/compare': (config: AxiosRequestConfig) => {
    const p = readParams(config);
    const mode = (p.get('mode') ?? 'env') as CompareResponse['mode'];
    const start = p.get('start') ?? undefined;
    const end = p.get('end') ?? undefined;

    const baseFiltered = filterEvents({
      start,
      end,
      severity: (p.get('severity') as EventsQuery['severity']) ?? '',
      ruleId: p.get('ruleId') ?? undefined
    });

    const byCondition = (key: 'siteId' | 'versionId' | 'env', v?: string | null) =>
      baseFiltered.filter((e) => (!v ? true : e[key] === v));

    let listA: EventRecord[] = [];
    let listB: EventRecord[] = [];

    if (mode === 'env') {
      listA = byCondition('env', 'blue').filter((e) => e.siteId === p.get('siteA') && e.versionId === p.get('versionA'));
      listB = byCondition('env', 'green').filter((e) => e.siteId === p.get('siteA') && e.versionId === p.get('versionA'));
    } else if (mode === 'version') {
      listA = byCondition('versionId', p.get('versionA')).filter((e) => e.siteId === p.get('siteA') && e.env === p.get('envA'));
      listB = byCondition('versionId', p.get('versionB')).filter((e) => e.siteId === p.get('siteA') && e.env === p.get('envA'));
    } else {
      listA = byCondition('siteId', p.get('siteA')).filter((e) => e.versionId === p.get('versionA') && e.env === p.get('envA'));
      listB = byCondition('siteId', p.get('siteB')).filter((e) => e.versionId === p.get('versionA') && e.env === p.get('envA'));
    }

    const sum = (arr: EventRecord[]) => arr.reduce((s, i) => s + i.count, 0);
    const totalA = sum(listA);
    const totalB = sum(listB);
    const diffRate = totalB === 0 ? 0 : Number((((totalA - totalB) / totalB) * 100).toFixed(2));

    const trendKeys = new Set([...listA, ...listB].map((i) => dayjs(i.timestamp).format('YYYY-MM-DD')));
    const trend = Array.from(trendKeys)
      .map((date) => ({
        date,
        a: sum(listA.filter((i) => dayjs(i.timestamp).format('YYYY-MM-DD') === date)),
        b: sum(listB.filter((i) => dayjs(i.timestamp).format('YYYY-MM-DD') === date))
      }))
      .sort((x, y) => dayjs(x.date).valueOf() - dayjs(y.date).valueOf());

    const aggregateByRule = (arr: EventRecord[]) =>
      arr.reduce<Record<string, number>>((acc, item) => {
        acc[item.ruleName] = (acc[item.ruleName] ?? 0) + item.count;
        return acc;
      }, {});

    const mapA = aggregateByRule(listA);
    const mapB = aggregateByRule(listB);
    const keys = Array.from(new Set([...Object.keys(mapA), ...Object.keys(mapB)]));

    const diffRanking = keys
      .map((key) => {
        const a = mapA[key] ?? 0;
        const b = mapB[key] ?? 0;
        return { key, a, b, diffRate: b === 0 ? 0 : Number((((a - b) / b) * 100).toFixed(2)) };
      })
      .sort((m, n) => Math.abs(n.diffRate) - Math.abs(m.diffRate));

    const response: CompareResponse = {
      mode,
      totalA,
      totalB,
      diffRate,
      trend,
      diffRanking,
      topDiffRules: diffRanking.slice(0, 10).map((d) => ({ ruleName: d.key, a: d.a, b: d.b, diffRate: d.diffRate }))
    };
    return [200, response];
  },
  '/api/events': (config: AxiosRequestConfig) => {
    const p = readParams(config);
    const page = Number(p.get('page') ?? 1);
    const pageSize = Number(p.get('pageSize') ?? 20);
    const sort = p.get('sort') ?? '';

    let list = filterEvents({
      start: p.get('start') ?? undefined,
      end: p.get('end') ?? undefined,
      siteIds: toArr(p.get('siteIds') ?? undefined),
      versionIds: toArr(p.get('versionIds') ?? undefined),
      env: (p.get('env') as EventsQuery['env']) ?? '',
      severity: (p.get('severity') as EventsQuery['severity']) ?? '',
      ruleId: p.get('ruleId') ?? undefined,
      q: p.get('q') ?? undefined
    });

    if (sort) {
      const [field, order] = sort.split(':');
      list = list.sort((a, b) => {
        const left = String((a as unknown as Record<string, string | number>)[field] ?? '');
        const right = String((b as unknown as Record<string, string | number>)[field] ?? '');
        return order === 'asc' ? left.localeCompare(right) : right.localeCompare(left);
      });
    }

    const startIdx = (page - 1) * pageSize;
    return [200, { list: list.slice(startIdx, startIdx + pageSize), total: list.length, page, pageSize }];
  },
  '/api/events/:id': (config: AxiosRequestConfig) => {
    const id = config.url?.split('/').pop() ?? '';
    const item = allEvents.find((e) => e.id === id);
    if (!item) return [404, { message: 'not found' }];

    const oneHourBefore = dayjs(item.timestamp).subtract(1, 'hour');
    const sameRule = allEvents
      .filter(
        (e) =>
          e.ruleId === item.ruleId &&
          e.siteId === item.siteId &&
          dayjs(e.timestamp).isAfter(oneHourBefore) &&
          dayjs(e.timestamp).isBefore(dayjs(item.timestamp))
      )
      .map((e) => ({ time: dayjs(e.timestamp).format('HH:mm'), count: e.count }));

    const topRules = Object.values(
      allEvents
        .filter(
          (e) =>
            e.siteId === item.siteId &&
            dayjs(e.timestamp).isAfter(oneHourBefore) &&
            dayjs(e.timestamp).isBefore(dayjs(item.timestamp))
        )
        .reduce<Record<string, { ruleName: string; count: number }>>((acc, e) => {
          acc[e.ruleId] = acc[e.ruleId] ?? { ruleName: e.ruleName, count: 0 };
          acc[e.ruleId].count += e.count;
          return acc;
        }, {})
    )
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return [200, { ...item, sameRuleTrend: sameRule, siteTopRules: topRules }];
  },
  '/api/snapshots': (config: AxiosRequestConfig) => {
    const p = readParams(config);
    const page = Number(p.get('page') ?? 1);
    const pageSize = Number(p.get('pageSize') ?? 10);
    const sort = p.get('sort') ?? 'createdAt:desc';

    const query: SnapshotQuery = {
      createdStart: p.get('createdStart') ?? undefined,
      createdEnd: p.get('createdEnd') ?? undefined,
      siteIds: toArr(p.get('siteIds') ?? undefined),
      versionIds: toArr(p.get('versionIds') ?? undefined),
      env: (p.get('env') as SnapshotQuery['env']) ?? '',
      severity: (p.get('severity') as SnapshotQuery['severity']) ?? '',
      ruleId: p.get('ruleId') ?? undefined,
      createdBy: p.get('createdBy') ?? undefined,
      q: p.get('q') ?? undefined
    };

    let list = snapshots.filter((snap) => {
      if (query.createdStart && dayjs(snap.createdAt).isBefore(dayjs(query.createdStart))) return false;
      if (query.createdEnd && dayjs(snap.createdAt).isAfter(dayjs(query.createdEnd))) return false;
      if (query.siteIds?.length && !query.siteIds.some((id) => snap.filters.siteIds?.includes(id))) return false;
      if (query.versionIds?.length && !query.versionIds.some((id) => snap.filters.versionIds?.includes(id))) return false;
      if (query.env && snap.filters.env !== query.env) return false;
      if (query.severity && snap.filters.severity !== query.severity) return false;
      if (query.ruleId && snap.filters.ruleId !== query.ruleId) return false;
      if (query.createdBy && !snap.createdBy.includes(query.createdBy)) return false;
      if (query.q && !`${snap.id}${snap.name}`.toLowerCase().includes(query.q.toLowerCase())) return false;
      return true;
    });

    const [field, order] = sort.split(':');
    list = list.sort((a, b) => {
      const left = String((a as unknown as Record<string, string | number>)[field] ?? '');
      const right = String((b as unknown as Record<string, string | number>)[field] ?? '');
      return order === 'asc' ? left.localeCompare(right) : right.localeCompare(left);
    });

    const startIdx = (page - 1) * pageSize;
    return [200, { total: list.length, items: list.slice(startIdx, startIdx + pageSize) }];
  },
  '/api/snapshots/:id': (config: AxiosRequestConfig) => {
    const id = config.url?.split('/').pop() ?? '';
    const detail = getSnapshotDetail(id);
    if (!detail) return [404, { message: 'not found' }];
    return [200, detail];
  },
  '/api/snapshots/:id/download': (config: AxiosRequestConfig) => {
    const [base, queryRaw] = (config.url ?? '').split('?');
    const id = base.split('/').slice(-2)[0];
    const params = new URLSearchParams(queryRaw ?? '');
    const format = params.get('format') ?? 'csv';
    const detail = getSnapshotDetail(id);
    if (!detail) return [404, { message: 'not found' }];
    if (detail.status !== 'ready') return [400, { message: 'snapshot unavailable' }];

    const events = getSnapshotEvents(id);
    if (format === 'json') {
      return [200, JSON.stringify(events), { 'Content-Type': 'application/json' }];
    }

    const header = [
      'id',
      'timestamp',
      'siteName',
      'env',
      'versionLabel',
      'ruleId',
      'ruleName',
      'severity',
      'count',
      'sourceModule',
      'message'
    ].join(',');
    const rows = events.map((e) =>
      [
        e.id,
        e.timestamp,
        e.siteName,
        e.env,
        e.versionLabel,
        e.ruleId,
        e.ruleName,
        e.severity,
        e.count,
        e.sourceModule,
        JSON.stringify(e.message)
      ].join(',')
    );
    return [200, [header, ...rows].join('\n'), { 'Content-Type': 'text/csv;charset=utf-8' }];
  }
};
