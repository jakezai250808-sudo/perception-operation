import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const outDir = resolve(process.cwd(), 'public/assets/dumptruck360');
await mkdir(outDir, { recursive: true });

const frameCount = 36;
for (let i = 0; i < frameCount; i += 1) {
  const t = (i / frameCount) * Math.PI * 2;
  const cabX = 60 + Math.cos(t) * 10;
  const bodySkew = Math.sin(t) * 8;
  const wheelShift = Math.cos(t) * 10;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1280 720'>
  <defs>
    <linearGradient id='bg' x1='0' x2='0' y1='0' y2='1'><stop offset='0%' stop-color='#07142b'/><stop offset='100%' stop-color='#06090f'/></linearGradient>
    <linearGradient id='truck' x1='0' x2='1' y1='0' y2='1'><stop offset='0%' stop-color='#f2e06b'/><stop offset='100%' stop-color='#7a6722'/></linearGradient>
    <linearGradient id='dump' x1='0' x2='1' y1='0' y2='1'><stop offset='0%' stop-color='#8fd2aa'/><stop offset='100%' stop-color='#325f49'/></linearGradient>
  </defs>
  <rect width='1280' height='720' fill='url(#bg)'/>
  <ellipse cx='640' cy='540' rx='360' ry='80' fill='rgba(77,153,255,.25)'/>
  <g transform='translate(340 250)'>
    <g transform='skewX(${bodySkew})'>
      <rect x='${cabX}' y='120' width='190' height='120' rx='24' fill='url(#truck)'/>
      <polygon points='280,130 620,80 700,220 320,240' fill='url(#dump)'/>
      <rect x='250' y='200' width='520' height='64' rx='24' fill='#3d4c57'/>
      <circle cx='${300 + wheelShift}' cy='290' r='62' fill='#1a2430'/>
      <circle cx='${300 + wheelShift}' cy='290' r='34' fill='#8092a5'/>
      <circle cx='${640 + wheelShift}' cy='290' r='74' fill='#1a2430'/>
      <circle cx='${640 + wheelShift}' cy='290' r='42' fill='#8092a5'/>
      <circle cx='${760 + wheelShift}' cy='290' r='74' fill='#1a2430'/>
      <circle cx='${760 + wheelShift}' cy='290' r='42' fill='#8092a5'/>
    </g>
  </g>
</svg>`;
  await writeFile(resolve(outDir, `frame_${String(i).padStart(2, '0')}.svg`), svg);
}
console.log(`generated ${frameCount} frames at ${outDir}`);
