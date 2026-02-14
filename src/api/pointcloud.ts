import { apiClient } from './client';
import type { PointCloudAsset } from '@/types';

export interface PointCloudResponse {
  items: PointCloudAsset[];
}

export const getPointCloudAssets = async (eventId: string) =>
  (await apiClient.get<PointCloudResponse>(`/events/${eventId}/pointcloud`)).data;
