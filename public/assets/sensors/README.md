# Sensor Model Assets

请放置真实传感器数模：

- `lidar.glb`
- `radar.glb`
- `camera.glb`

当前页面会优先读取这些模型路径（用于 3D 叠加）。
若仅使用 360 帧回退模式，也会读取同名传感器贴图（camera.svg/radar.svg/lidar.svg/redundancy.svg）进行 2D 叠加。
