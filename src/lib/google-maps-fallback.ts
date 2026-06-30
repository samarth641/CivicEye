/** Google Maps quota, billing, and key errors → switch to Leaflet */
const GOOGLE_MAP_FAIL_PATTERN =
  /OverQuotaMapError|ExpiredKeyMapError|InvalidKeyMapError|RefererNotAllowedMapError|ApiNotActivatedMapError|BillingNotEnabledMapError/i;

let onFallback: ((reason: string) => void) | null = null;
let fallbackTriggered = false;

export function registerGoogleMapsFallback(handler: (reason: string) => void) {
  onFallback = handler;
}

export function triggerGoogleMapsFallback(reason: string) {
  if (fallbackTriggered) return;
  fallbackTriggered = true;
  onFallback?.(reason);
}

export function resetGoogleMapsFallbackState() {
  fallbackTriggered = false;
}

export function installGoogleMapsErrorWatcher(): () => void {
  if (typeof window === "undefined") return () => {};

  const original = console.error;
  console.error = (...args: unknown[]) => {
    const text = args
      .map((a) => {
        if (typeof a === "string") return a;
        if (a instanceof Error) return a.message;
        try {
          return JSON.stringify(a);
        } catch {
          return String(a);
        }
      })
      .join(" ");

    if (GOOGLE_MAP_FAIL_PATTERN.test(text)) {
      triggerGoogleMapsFallback(text);
    }

    original.apply(console, args);
  };

  return () => {
    console.error = original;
  };
}

export function parseGoogleMapsErrorReason(
  text: string
): "quota" | "key" | "billing" | "api" {
  if (/OverQuota/i.test(text)) return "quota";
  if (/ExpiredKey|InvalidKey/i.test(text)) return "key";
  if (/BillingNotEnabled/i.test(text)) return "billing";
  return "api";
}
