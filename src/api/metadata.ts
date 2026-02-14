import { apiClient } from './client';

export interface SiteManageItem {
  id: string;
  name: string;
  city: string;
}

export interface EventRuleManageItem {
  id: string;
  name: string;
  type: 'trigger' | 'alarm';
  severity: 'P0' | 'P1' | 'P2' | 'P3';
}

export const listManageSites = async () => (await apiClient.get<SiteManageItem[]>('/metadata/sites')).data;
export const createManageSite = async (payload: SiteManageItem) =>
  (await apiClient.post<SiteManageItem>('/metadata/sites', payload)).data;
export const updateManageSite = async (id: string, payload: SiteManageItem) =>
  (await apiClient.put<SiteManageItem>(`/metadata/sites/${id}`, payload)).data;
export const deleteManageSite = async (id: string) => (await apiClient.delete(`/metadata/sites/${id}`)).data;

export const listManageRules = async () => (await apiClient.get<EventRuleManageItem[]>('/metadata/events')).data;
export const createManageRule = async (payload: EventRuleManageItem) =>
  (await apiClient.post<EventRuleManageItem>('/metadata/events', payload)).data;
export const updateManageRule = async (id: string, payload: EventRuleManageItem) =>
  (await apiClient.put<EventRuleManageItem>(`/metadata/events/${id}`, payload)).data;
export const deleteManageRule = async (id: string) => (await apiClient.delete(`/metadata/events/${id}`)).data;
