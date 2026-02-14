import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, LineChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import VChart from 'vue-echarts';
import App from './App.vue';
import { router } from './router';
import './styles/theme.css';

echarts.use([CanvasRenderer, BarChart, LineChart, TooltipComponent, LegendComponent, GridComponent]);

createApp(App)
  .component('VChart', VChart)
  .use(createPinia())
  .use(router)
  .use(ElementPlus)
  .mount('#app');
