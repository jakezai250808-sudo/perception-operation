export interface MenuItem {
  key: string;
  label: string;
  icon?: string;
  path?: string;
  children?: MenuItem[];
  roles?: string[];
  hidden?: boolean;
}

const dict = {
  'zh-CN': {
    dashboard: '概览 Dashboard',
    compare: '对比分析 Compare',
    events: '事件中心 Events',
    eventsList: '事件列表',
    snapshots: '快照 Snapshots',
    map: '地图 Map',
    versions: '版本画像',
    rules: '规则字典'
  }
};

const t = (key: keyof (typeof dict)['zh-CN']): string => dict['zh-CN'][key];

export const menuSchema: MenuItem[] = [
  { key: '/dashboard', label: t('dashboard'), path: '/dashboard', icon: '📈', roles: ['ops', 'admin'] },
  { key: '/compare', label: t('compare'), path: '/compare', icon: '🧮', roles: ['ops', 'admin'] },
  {
    key: '/events',
    label: t('events'),
    icon: '🗂️',
    roles: ['ops', 'admin'],
    children: [
      { key: '/events/list', label: t('eventsList'), path: '/events?tab=events', roles: ['ops', 'admin'] },
      { key: '/events/snapshots', label: t('snapshots'), path: '/events?tab=snapshots', roles: ['ops', 'admin'] },
      { key: '/events/map', label: t('map'), path: '/events?tab=map', roles: ['ops', 'admin'] }
    ]
  },
  { key: '/versions', label: t('versions'), path: '/versions', icon: '🧬', roles: ['admin'], hidden: true },
  { key: '/rules', label: t('rules'), path: '/rules', icon: '📚', roles: ['admin'], hidden: true }
];
