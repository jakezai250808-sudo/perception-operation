import { apiClient } from './client';

export interface XodrMapResponse {
  url?: string;
  polylines: Array<Array<[number, number]>>;
}

export const getXodr = async (siteId: string) =>
  (await apiClient.get<XodrMapResponse>('/maps/xodr', { params: { siteId } })).data;
