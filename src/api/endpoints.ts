import { apiClient } from './client';
import type {
  CompareResponse,
  DashboardSummary,
  EventsQuery,
  PagedEvents,
  Rule,
  Site,
  SnapshotDetail,
  SnapshotListResponse,
  SnapshotQuery,
  Version
} from '@/types';

export const getSites = async () => (await apiClient.get<Site[]>('/meta/sites')).data;
export const getVersions = async () => (await apiClient.get<Version[]>('/meta/versions')).data;
export const getRules = async () => (await apiClient.get<Rule[]>('/meta/rules')).data;

export const getDashboardSummary = async (params: Record<string, string>) =>
  (await apiClient.get<DashboardSummary>('/dashboard/summary', { params })).data;

export const getCompareData = async (params: Record<string, string>) =>
  (await apiClient.get<CompareResponse>('/compare', { params })).data;

export const getEvents = async (params: Record<string, string | number>) =>
  (await apiClient.get<PagedEvents>('/events', { params })).data;

export const getEventDetail = async (id: string) => (await apiClient.get(`/events/${id}`)).data;

export const getSnapshots = async (params: Record<string, string | number>) =>
  (await apiClient.get<SnapshotListResponse>('/snapshots', { params })).data;

export const getSnapshotDetail = async (id: string) => (await apiClient.get<SnapshotDetail>(`/snapshots/${id}`)).data;

export const downloadSnapshotDetail = async (id: string, format: 'csv' | 'json') =>
  (await apiClient.get(`/snapshots/${id}/download`, { params: { format }, responseType: 'blob' })).data as Blob;

export function buildEventsParams(query: EventsQuery): Record<string, string | number> {
  return {
    start: query.start ?? '',
    end: query.end ?? '',
    siteIds: query.siteIds?.join(',') ?? '',
    versionIds: query.versionIds?.join(',') ?? '',
    env: query.env ?? '',
    severity: query.severity ?? '',
    ruleId: query.ruleId ?? '',
    q: query.q ?? '',
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 20,
    sort: query.sort ?? ''
  };
}

export function buildSnapshotParams(query: SnapshotQuery): Record<string, string | number> {
  const joinedSites = query.siteIds?.join(',') ?? '';
  return {
    createdStart: query.createdStart ?? '',
    createdEnd: query.createdEnd ?? '',
    // 新后端约定使用 site 字段，保留 siteIds 兼容旧接口。
    site: joinedSites,
    siteIds: joinedSites,
    versionIds: query.versionIds?.join(',') ?? '',
    env: query.env ?? '',
    severity: query.severity ?? '',
    ruleId: query.ruleId ?? '',
    createdBy: query.createdBy ?? '',
    q: query.q ?? '',
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 20,
    sort: query.sort ?? ''
  };
}
