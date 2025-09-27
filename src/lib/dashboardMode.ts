export type DashboardMode = 'travel' | 'hosting';

const STORAGE_KEY = 'dashboardMode';

export function getLastDashboardMode(): DashboardMode | null {
  if (typeof window === 'undefined') return null;
  const v = window.localStorage.getItem(STORAGE_KEY);
  if (v === 'travel' || v === 'hosting') return v;
  return null;
}

export function setLastDashboardMode(mode: DashboardMode) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, mode);
}
