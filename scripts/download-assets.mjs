import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const modelUrl =
  process.env.DUMP_TRUCK_MODEL_URL ||
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb';

const outFile = resolve(process.cwd(), 'public/assets/models/dump_truck.glb');

await mkdir(dirname(outFile), { recursive: true });

const response = await fetch(modelUrl);
if (!response.ok) {
  throw new Error(`下载失败: ${response.status} ${response.statusText}`);
}

const buf = Buffer.from(await response.arrayBuffer());
await writeFile(outFile, buf);

console.log(`模型下载完成: ${outFile}`);
console.log(`来源: ${modelUrl}`);
