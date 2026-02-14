import type { AxiosInstance } from 'axios';
import AxiosMockAdapter from 'axios-mock-adapter';
import { handlers } from './handlers';

export function setupMock(client: AxiosInstance): void {
  const mock = new AxiosMockAdapter(client, { delayResponse: 300 });

  Object.entries(handlers).forEach(([path, handler]) => {
    if (path === '/api/events/:id') {
      mock.onGet(/\/api\/events\/EVT-.+/).reply((config) => handler(config));
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
}
