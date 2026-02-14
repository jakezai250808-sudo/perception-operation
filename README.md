# 自动驾驶运营可观测对比分析平台（V1）

## 启动方式
```bash
pnpm install
pnpm dev
```

构建与检查：
```bash
pnpm lint
pnpm build
```

## 技术栈
- Vue 3 + Vite + TypeScript(strict)
- Vue Router / Pinia
- Element Plus
- ECharts + vue-echarts
- Axios + axios-mock-adapter

## 目录结构
```text
src/
  api/            # axios实例、接口封装
  mock/           # mock handlers + 数据生成
  router/         # 路由
  store/          # pinia状态
  types/          # TS 类型
  pages/          # Dashboard/Compare/Events/Detail/404
  components/     # FilterBar/ChartCard/EmptyState/ErrorState
  utils/          # 日期、CSV导出、查询持久化、图表option
  styles/         # 主题样式
```

## Mock 说明
- 通过 `VITE_USE_MOCK=true` 开启 mock。
- 覆盖 REST endpoints：
  - `GET /api/meta/sites`
  - `GET /api/meta/versions`
  - `GET /api/meta/rules`
  - `GET /api/dashboard/summary`
  - `GET /api/compare`
  - `GET /api/events`
  - `GET /api/events/:id`
- 数据特征：3个局点、4个版本、蓝绿环境、24条规则，事件随时间波动，并对特定版本/环境设置异常因子。
- 异常指数公式：`anomalyScore = currentWindow / baselineWindow`，baseline 取历史窗口均值。

## 对接真实 API
- 入口：`src/api/client.ts`。
- 关闭 mock：将 `.env.production` 或 `.env.development` 中 `VITE_USE_MOCK=false`。
- 保持 `src/types` 不变，替换 `src/api/endpoints.ts` 的请求参数映射即可。
