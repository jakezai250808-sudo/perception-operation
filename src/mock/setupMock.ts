import type { AxiosInstance } from 'axios';
import AxiosMockAdapter from 'axios-mock-adapter';
import { deleteHandlers, handlers, postHandlers, putHandlers } from './handlers';

export function setupMock(client: AxiosInstance): void {
  const mock = new AxiosMockAdapter(client, { delayResponse: 300 });

  Object.entries(handlers).forEach(([path, handler]) => {
    if (path === '/api/events/:id/pointcloud') {
      mock.onGet(/\/api\/events\/EVT-.+\/pointcloud$/).reply((config) => handler(config));
      return;
    }
    if (path === '/api/events/:id') {
      mock.onGet(/\/api\/events\/EVT-.+$/).reply((config) => handler(config));
      return;
    }
    if (path === '/api/snapshots/:id') {
      mock.onGet(/\/api\/snapshots\/SNAP-.+$/).reply((config) => handler(config));
      return;
    }
    if (path === '/api/snapshots/:id/download') {
      mock.onGet(/\/api\/snapshots\/SNAP-.+\/download.*/).reply((config) => handler(config));
      return;
    }
    mock.onGet(new RegExp(path.replace('/', '\\/'))).reply((config) => handler(config));
  });

  Object.entries(postHandlers).forEach(([path, handler]) => {
    mock.onPost(new RegExp(path.replace('/', '\\/'))).reply((config) => handler(config));
  });

  Object.entries(putHandlers).forEach(([path, handler]) => {
    if (path === '/api/metadata/sites/:id') {
      mock.onPut(/\/api\/metadata\/sites\/.+/).reply((config) => handler(config));
      return;
    }
    if (path === '/api/metadata/events/:id') {
      mock.onPut(/\/api\/metadata\/events\/.+/).reply((config) => handler(config));
      return;
    }
  });

  Object.entries(deleteHandlers).forEach(([path, handler]) => {
    if (path === '/api/metadata/sites/:id') {
      mock.onDelete(/\/api\/metadata\/sites\/.+/).reply((config) => handler(config));
      return;
    }
    if (path === '/api/metadata/events/:id') {
      mock.onDelete(/\/api\/metadata\/events\/.+/).reply((config) => handler(config));
      return;
    }
  });
}
