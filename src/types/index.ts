export type EnvType = 'blue' | 'green';
export type Severity = 'P0' | 'P1' | 'P2' | 'P3';

export interface Site {
  id: string;
  name: string;
  city: string;
}

export interface Version {
  id: string;
  label: string;
  releaseDate: string;
}

export interface Rule {
  id: string;
  name: string;
  type: 'trigger' | 'alarm';
  severity: Severity;
}

export interface EventRecord {
  id: string;
  timestamp: string;
  siteId: string;
  siteName: string;
  env: EnvType;
  versionId: string;
  versionLabel: string;
  ruleId: string;
  ruleName: string;
  severity: Severity;
  count: number;
  sourceModule: string;
  message: string;
}

export interface TrendPoint {
  date: string;
  total: number;
  blue: number;
  green: number;
}

export interface DashboardSummary {
  trend: TrendPoint[];
  topRules: Array<{ ruleName: string; count: number }>;
  siteHealth: Array<{ siteName: string; eventCount: number; anomalyScore: number }>;
  versionAnomaly: Array<{ versionLabel: string; eventCount: number; anomalyScore: number }>;
}

export interface CompareResponse {
  mode: 'env' | 'version' | 'site';
  totalA: number;
  totalB: number;
  diffRate: number;
  trend: Array<{ date: string; a: number; b: number }>;
  diffRanking: Array<{ key: string; a: number; b: number; diffRate: number }>;
  topDiffRules: Array<{ ruleName: string; a: number; b: number; diffRate: number }>;
}

export interface EventsQuery {
  start?: string;
  end?: string;
  siteIds?: string[];
  versionIds?: string[];
  env?: EnvType | '';
  severity?: Severity | '';
  ruleId?: string;
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
}

export interface PagedEvents {
  list: EventRecord[];
  total: number;
  page: number;
  pageSize: number;
}
