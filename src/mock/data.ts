import dayjs from 'dayjs';
import type {
  EnvType,
  EventRecord,
  Rule,
  Severity,
  Site,
  SnapshotDetail,
  SnapshotFilters,
  SnapshotRecord,
  Version
} from '@/types';

const severities: Severity[] = ['P0', 'P1', 'P2', 'P3'];
const modules = ['perception', 'planner', 'localization', 'controller', 'scheduler'];
const creators = ['alice.ops', 'bob.ops', 'charlie.ops', 'diana.sre'];

export const sites: Site[] = [
  { id: 'site-bj', name: '北京局点', city: '北京' },
  { id: 'site-sh', name: '上海局点', city: '上海' },
  { id: 'site-sz', name: '深圳局点', city: '深圳' }
];

export const versions: Version[] = [
  { id: 'v2.9.0', label: 'v2.9.0', releaseDate: '2025-10-01' },
  { id: 'v2.9.1', label: 'v2.9.1', releaseDate: '2025-11-01' },
  { id: 'v2.10.0', label: 'v2.10.0', releaseDate: '2025-12-01' },
  { id: 'v2.10.1', label: 'v2.10.1', releaseDate: '2026-01-15' }
];

export const rules: Rule[] = Array.from({ length: 24 }).map((_, idx) => ({
  id: `R-${String(idx + 1).padStart(3, '0')}`,
  name: `规则-${idx + 1}`,
  type: idx % 2 === 0 ? 'trigger' : 'alarm',
  severity: severities[idx % 4]
}));

const anomalyFactors: Record<string, number> = {
  'site-bj': 1,
  'site-sh': 1.3,
  'site-sz': 0.8,
  'v2.9.0': 1,
  'v2.9.1': 0.95,
  'v2.10.0': 1.4,
  'v2.10.1': 1.2,
  blue: 0.9,
  green: 1.15
};

function random(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * 异常指数公式：anomalyScore = currentWindow / baselineWindow。
 * baselineWindow 用最近 7~14 天均值；>1 表示高于基线。
 */
export function anomalyScore(current: number, baseline: number): number {
  if (baseline <= 0) return Number(current > 0);
  return Number((current / baseline).toFixed(2));
}

export const allEvents: EventRecord[] = generateEvents();
export const snapshots: SnapshotRecord[] = generateSnapshots();

function generateEvents(): EventRecord[] {
  const items: EventRecord[] = [];
  const startDate = dayjs().subtract(45, 'day');
  let id = 1;

  for (let d = 0; d < 45; d += 1) {
    const currentDate = startDate.add(d, 'day');
    const dayWave = 0.7 + 0.6 * Math.abs(Math.sin(d / 4));

    sites.forEach((site, sIdx) => {
      (['blue', 'green'] as EnvType[]).forEach((env, envIdx) => {
        versions.forEach((version, vIdx) => {
          rules.forEach((rule, rIdx) => {
            const factor =
              dayWave *
              anomalyFactors[site.id] *
              anomalyFactors[version.id] *
              anomalyFactors[env] *
              (rule.severity === 'P0' ? 1.5 : 1);

            const shouldEmit = random(d * 31 + sIdx * 19 + envIdx * 13 + vIdx * 7 + rIdx) > 0.72;
            if (!shouldEmit) return;

            const base = Math.floor((random(d + rIdx + 1) * 18 + 2) * factor);
            const count = Math.max(1, base);
            items.push({
              id: `EVT-${String(id).padStart(7, '0')}`,
              timestamp: currentDate.hour(8 + (rIdx % 12)).minute((rIdx * 5) % 60).toISOString(),
              siteId: site.id,
              siteName: site.name,
              env,
              versionId: version.id,
              versionLabel: version.label,
              ruleId: rule.id,
              ruleName: rule.name,
              severity: rule.severity,
              count,
              sourceModule: modules[(rIdx + sIdx) % modules.length],
              message: `${rule.name} 在 ${site.name}/${env}/${version.label} 触发，事件数 ${count}`
            });
            id += 1;
          });
        });
      });
    });
  }

  return items.sort((a, b) => dayjs(b.timestamp).valueOf() - dayjs(a.timestamp).valueOf());
}

function filterBySnapshot(events: EventRecord[], filters: SnapshotFilters): EventRecord[] {
  return events.filter((event) => {
    if (filters.start && dayjs(event.timestamp).isBefore(dayjs(filters.start))) return false;
    if (filters.end && dayjs(event.timestamp).isAfter(dayjs(filters.end))) return false;
    if (filters.siteIds?.length && !filters.siteIds.includes(event.siteId)) return false;
    if (filters.versionIds?.length && !filters.versionIds.includes(event.versionId)) return false;
    if (filters.env && event.env !== filters.env) return false;
    if (filters.severity && event.severity !== filters.severity) return false;
    if (filters.ruleId && event.ruleId !== filters.ruleId) return false;
    if (filters.q && !`${event.ruleName}${event.message}`.includes(filters.q)) return false;
    return true;
  });
}

function generateSnapshots(): SnapshotRecord[] {
  const statuses: SnapshotRecord['status'][] = ['ready', 'ready', 'ready', 'processing', 'expired'];
  return Array.from({ length: 28 }).map((_, idx) => {
    const createdAt = dayjs().subtract(idx * 5 + 2, 'hour');
    const start = createdAt.subtract(24, 'hour').format('YYYY-MM-DD');
    const end = createdAt.format('YYYY-MM-DD');
    const siteIds = idx % 2 === 0 ? ['site-bj', 'site-sh'] : ['site-sz'];
    const versionIds = idx % 3 === 0 ? ['v2.10.0', 'v2.10.1'] : ['v2.9.1'];
    const env: EnvType | '' = idx % 4 === 0 ? 'blue' : idx % 4 === 1 ? 'green' : '';
    const severity: Severity | '' = idx % 3 === 0 ? 'P1' : '';
    const ruleId = idx % 5 === 0 ? rules[idx % rules.length].id : '';

    const filters: SnapshotFilters = { start, end, siteIds, versionIds, env, severity, ruleId };
    const matched = filterBySnapshot(allEvents, filters);
    const eventCount = matched.reduce((sum, i) => sum + i.count, 0);
    const baseline =
      allEvents
        .filter((e) => dayjs(e.timestamp).isAfter(dayjs().subtract(14, 'day')))
        .reduce((sum, i) => sum + i.count, 0) / 2;

    const topRules = Object.values(
      matched.reduce<Record<string, { ruleName: string; count: number }>>((acc, cur) => {
        acc[cur.ruleId] = acc[cur.ruleId] ?? { ruleName: cur.ruleName, count: 0 };
        acc[cur.ruleId].count += cur.count;
        return acc;
      }, {})
    )
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      id: `SNAP-${String(idx + 1).padStart(4, '0')}`,
      name: `${createdAt.format('YYYY-MM-DD_HH-mm')}_${siteIds.join('-')}_${versionIds[0]}_${env || 'all'}`,
      createdAt: createdAt.toISOString(),
      createdBy: creators[idx % creators.length],
      timeRangeStart: start,
      timeRangeEnd: end,
      filters,
      summary: {
        eventCount,
        anomalyScore: anomalyScore(eventCount, baseline),
        topRules,
        trend: Array.from({ length: 7 }).map((__, tIdx) => ({
          date: createdAt.subtract(6 - tIdx, 'day').format('YYYY-MM-DD'),
          value: Math.max(0, Math.floor(eventCount / 12 + random(idx * 17 + tIdx) * 80))
        }))
      },
      status: statuses[idx % statuses.length]
    };
  });
}

export function getSnapshotDetail(id: string): SnapshotDetail | undefined {
  const item = snapshots.find((s) => s.id === id);
  if (!item) return undefined;
  return {
    ...item,
    details: {
      description: '快照用于复现当时筛选条件下的数据分析视图，并支持下载更详细事件明细。'
    }
  };
}

export function getSnapshotEvents(id: string): EventRecord[] {
  const snap = snapshots.find((s) => s.id === id);
  if (!snap) return [];
  return filterBySnapshot(allEvents, snap.filters);
}
