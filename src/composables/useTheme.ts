import { ref, watch } from 'vue';

const KEY = 'po_theme';

export type ThemeMode = 'dark' | 'light';

export function useTheme() {
  const theme = ref<ThemeMode>((localStorage.getItem(KEY) as ThemeMode) || 'dark');

  const applyTheme = (mode: ThemeMode) => {
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem(KEY, mode);
  };

  watch(
    theme,
    (mode) => {
      applyTheme(mode);
    },
    { immediate: true }
  );

  return { theme };
}
