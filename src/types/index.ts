export type EnvType = 'blue' | 'green';
export type Severity = 'P0' | 'P1' | 'P2' | 'P3';

export interface Site {
  id: string;
  name: string;
  city: string;
  map?: SiteMapMeta;
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

export type SnapshotStatus = 'ready' | 'expired' | 'processing';

export interface SnapshotFilters {
  start?: string;
  end?: string;
  siteIds?: string[];
  versionIds?: string[];
  env?: EnvType | '';
  severity?: Severity | '';
  ruleId?: string;
  q?: string;
}

export interface SnapshotSummary {
  eventCount: number;
  anomalyScore: number;
  topRules: Array<{ ruleName: string; count: number }>;
  trend?: Array<{ date: string; value: number }>;
}

export interface SnapshotRecord {
  id: string;
  name: string;
  createdAt: string;
  createdBy: string;
  timeRangeStart: string;
  timeRangeEnd: string;
  filters: SnapshotFilters;
  summary: SnapshotSummary;
  status: SnapshotStatus;
}

export interface SnapshotListResponse {
  total: number;
  items: SnapshotRecord[];
}

export interface SnapshotDetail extends SnapshotRecord {
  details: {
    description: string;
  };
}

export interface SnapshotQuery {
  createdStart?: string;
  createdEnd?: string;
  siteIds?: string[];
  versionIds?: string[];
  env?: EnvType | '';
  severity?: Severity | '';
  ruleId?: string;
  createdBy?: string;
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
}


export interface SiteMapMeta {
  xodrUrl: string;
  basemapUrl?: string;
  bbox: { minX: number; maxX: number; minY: number; maxY: number };
}

export interface GeoPosition {
  world: { x: number; y: number; z?: number };
  lane?: { roadId: string; s: number; t: number };
}

export interface GeoEvent {
  id: string;
  ts: string;
  siteId: string;
  env: EnvType;
  version: string;
  severity: Severity;
  ruleId: string;
  message: string;
  position: GeoPosition;
}

export interface PointCloudAsset {
  id: string;
  type: "pcd";
  url: string;
  frameId?: string;
  sensor?: string;
  createdAt?: string;
  pointCount?: number;
  fileSizeMb?: number;
}
