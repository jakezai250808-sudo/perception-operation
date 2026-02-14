import type { BarSeriesOption, EChartsOption, LineSeriesOption } from 'echarts';

export const lineOption = (
  xData: string[],
  series: Array<{ name: string; data: number[] }>
): EChartsOption => ({
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: xData },
  yAxis: { type: 'value' },
  legend: { textStyle: { color: '#ccc' } },
  series: series.map(
    (item) => ({ type: 'line', smooth: true, name: item.name, data: item.data }) as LineSeriesOption
  )
});

export const barOption = (
  xData: string[],
  data: number[],
  name = 'count',
  horizontal = false
): EChartsOption => ({
  tooltip: { trigger: 'axis' },
  xAxis: horizontal ? { type: 'value' } : { type: 'category', data: xData },
  yAxis: horizontal ? { type: 'category', data: xData } : { type: 'value' },
  series: [{ type: 'bar', data, name }] as BarSeriesOption[]
});
