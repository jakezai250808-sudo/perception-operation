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

本页面视觉基准参考：同力重工 TLE 系列产品页（仅作风格参考，不含其受保护商业素材）  
https://www.sntonly.com/product/pro-detail-121823.htm

选配器支持双路径：

1. **3D 模型优先路径**（`public/assets/models/dump_truck_tle.glb`）
2. **360 序列帧回退路径**（`public/assets/dumptruck360/frame_00.svg ... frame_35.svg`）

当 3D 车模缺失或加载失败时，会自动切换到 360 帧模式（仍支持传感器叠加与步骤动画）。

### 文件路径约定

- 车模型：`public/assets/models/dump_truck_tle.glb`
- 传感器模型（真实 GLB，建议替换为可商用授权模型）：
  - `public/assets/sensors/lidar.glb`
  - `public/assets/sensors/radar.glb`
  - `public/assets/sensors/camera.glb`

### 下载脚本

```bash
node scripts/download-assets.mjs
```

可通过环境变量指定下载地址（建议填你们已审计许可的真实模型地址）：

```bash
DUMP_TRUCK_MODEL_URL="https://your-host/dump_truck_tle.glb" \
SENSOR_LIDAR_URL="https://your-host/lidar.glb" \
SENSOR_RADAR_URL="https://your-host/radar.glb" \
SENSOR_CAMERA_URL="https://your-host/camera.glb" \
node scripts/download-assets.mjs
```

> 如果不提供 `SENSOR_*_URL`，脚本会跳过对应传感器下载。

### 当前默认资源来源与许可说明

- 默认车模下载地址：
  - Khronos glTF Sample Models - CesiumMilkTruck  
    https://github.com/KhronosGroup/glTF-Sample-Models/tree/master/2.0/CesiumMilkTruck
- 许可说明：请以模型来源页面的最新许可条款为准；用于正式演示/商用前，务必由你们法务确认。
- 传感器模型：当前仓库仅提供路径规范与下载入口，**请替换为真实传感器数模并补充署名**。

### 传感器署名模板（CC BY 示例）

当使用 CC BY 模型时，请在 README 增加：

- 传感器类型：LiDAR / Radar / Camera
- 模型链接：<URL>
- 作者：<Author>
- License：CC BY 4.0
- 署名文本："<Model Name> by <Author>, licensed under CC BY 4.0"

### 锚点调试

在 URL 增加 `?debugAnchors=1` 可查看挂点调试（3D 模式显示坐标轴球点，360 模式显示十字锚点）。
