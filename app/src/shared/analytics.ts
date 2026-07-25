/**
 * 轻量埋点：事件先落 localStorage 缓冲（上限 200 条），
 * 后续接入后端时只需替换 flush() 的投递目标。
 */

export interface TrackEvent {
  name: string;
  props?: Record<string, string | number | boolean>;
  at: number;
}

const KEY = 'gz.analytics.v1';
const MAX_BUFFER = 200;

function buffer(): TrackEvent[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function trackEvent(name: string, props?: TrackEvent['props']): void {
  try {
    const list = buffer();
    list.push({ name, props, at: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX_BUFFER)));
  } catch {
    // 存储不可用时静默降级，不影响主流程
  }
}

export function getEvents(): TrackEvent[] {
  return buffer();
}

export function clearEvents(): void {
  localStorage.removeItem(KEY);
}
