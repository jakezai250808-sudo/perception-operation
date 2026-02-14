import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const targets = [
  {
    name: 'truck',
    url:
      process.env.DUMP_TRUCK_MODEL_URL ||
      'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb',
    file: resolve(process.cwd(), 'public/assets/models/dump_truck_tle.glb')
  },
  {
    name: 'lidar',
    url: process.env.SENSOR_LIDAR_URL || '',
    file: resolve(process.cwd(), 'public/assets/sensors/lidar.glb')
  },
  {
    name: 'radar',
    url: process.env.SENSOR_RADAR_URL || '',
    file: resolve(process.cwd(), 'public/assets/sensors/radar.glb')
  },
  {
    name: 'camera',
    url: process.env.SENSOR_CAMERA_URL || '',
    file: resolve(process.cwd(), 'public/assets/sensors/camera.glb')
  }
];

for (const item of targets) {
  if (!item.url) {
    console.log(`[skip] ${item.name}: 未提供下载地址`);
    continue;
  }
  await mkdir(dirname(item.file), { recursive: true });
  const response = await fetch(item.url);
  if (!response.ok) {
    throw new Error(`[${item.name}] 下载失败: ${response.status} ${response.statusText}`);
  }
  const buf = Buffer.from(await response.arrayBuffer());
  await writeFile(item.file, buf);
  console.log(`[ok] ${item.name}: ${item.file}`);
  console.log(`      source: ${item.url}`);
}
