# 自动驾驶运营可观测对比分析平台（V1）

## 启动方式
```bash
npm install
npm run dev
```

默认会监听 `0.0.0.0:5173`，局域网内可通过 `http://<你的本机IP>:5173` 访问。

构建与检查：
```bash
npm run lint
npm run build
```


## 后端系统地址配置
支持两种方式：

1) **直接配置完整 API 地址**（兼容旧方式）
```env
VITE_API_BASE_URL=/api
# 或
VITE_API_BASE_URL=http://10.0.0.8:8080/api
```

2) **配置后端系统地址 + API 前缀**（推荐）
```env
VITE_BACKEND_BASE_URL=http://10.0.0.8:8080
VITE_API_BASE_PATH=/api
```
最终请求地址会拼接为：`VITE_BACKEND_BASE_URL + VITE_API_BASE_PATH`。

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


## 宽体自卸车选配 Demo（矿卡）模型说明

选配页的 3D 查看器会加载以下模型路径：

- `public/assets/models/dump_truck.glb`

### 默认下载脚本

仓库提供 `scripts/download-assets.mjs`，可在网络可达时下载默认 GLB 到指定路径：

```bash
node scripts/download-assets.mjs
```

你也可以用环境变量改为你自己的模型地址：

```bash
DUMP_TRUCK_MODEL_URL="https://your-host/dump-truck.glb" node scripts/download-assets.mjs
```

### 模型来源与许可（当前默认）

- **来源**：Khronos glTF Sample Models - CesiumMilkTruck
  - https://github.com/KhronosGroup/glTF-Sample-Models/tree/master/2.0/CesiumMilkTruck
- **许可**：遵循该仓库与模型页面声明（示例资源通常为开放演示用途，请在商用前再次核验）

### 替换为更真实矿卡模型

建议替换为你们业务侧确认可用的 **非公路矿用宽体自卸车** GLB/GLTF，并保持文件名：

- `public/assets/models/dump_truck.glb`

替换后无需改代码，选配器会自动加载新模型，并使用包围盒推断挂点（可加 `?debugAnchors=1` 查看锚点调试球与坐标轴）。
