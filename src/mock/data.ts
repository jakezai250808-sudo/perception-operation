import dayjs from 'dayjs';
import type { EnvType, EventRecord, Rule, Severity, Site, Version } from '@/types';

const severities: Severity[] = ['P0', 'P1', 'P2', 'P3'];
const modules = ['perception', 'planner', 'localization', 'controller', 'scheduler'];

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
