import { apiClient } from './client';
import type { GeoEvent } from '@/types';

export interface GeoEventsResponse {
  items: GeoEvent[];
}

export const listGeoEvents = async (params: Record<string, string | number>) =>
  (await apiClient.get<GeoEventsResponse>('/events/geo', { params })).data;
