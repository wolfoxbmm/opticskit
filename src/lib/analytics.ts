// Umami event tracking helper for OpticsKit
// Uses window.umami which is loaded via <script> in layout.tsx

type ToolAction = 
  | 'tool_load'
  | 'tool_calculate'
  | 'tool_export'
  | 'tool_import'
  | 'tool_reset'
  | 'tool_share'
  | 'tool_interact';

interface TrackPayload {
  tool: string;
  action: ToolAction;
  [key: string]: string | number | boolean | undefined;
}

const ANALYTICS_ENABLED = typeof window !== 'undefined';

export function trackEvent(tool: string, action: ToolAction, data?: Record<string, string | number | boolean>) {
  if (!ANALYTICS_ENABLED) return;
  
  try {
    const umami = (window as any).umami;
    if (typeof umami?.track === 'function') {
      umami.track(action, { tool, ...data });
    }
  } catch {
    // analytics failure should never break the app
  }
}

// Convenience wrappers
export function trackPageView(tool: string) {
  trackEvent(tool, 'tool_load');
}

export function trackCalculate(tool: string, params?: Record<string, string | number>) {
  trackEvent(tool, 'tool_calculate', params);
}

export function trackExport(tool: string, format: string) {
  trackEvent(tool, 'tool_export', { format });
}

export function trackImport(tool: string, source: string) {
  trackEvent(tool, 'tool_import', { source });
}

export function trackInteract(tool: string, element: string, value?: string) {
  trackEvent(tool, 'tool_interact', { element, value: value || "" });
}
