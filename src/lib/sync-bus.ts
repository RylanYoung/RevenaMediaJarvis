// Same-tab instant sync: when any panel successfully adds/moves/deletes
// something, it calls notifyDataChanged() — every other polling component
// on the page (listening via usePollingEffect) re-fetches immediately
// instead of waiting for its next timer tick. Cross-tab/cross-device sync
// still rides the 15s poll — true instant there needs a server push
// (Supabase Realtime or websockets), which is a bigger change than this.
const EVENT_NAME = "revena:data-changed";

export function notifyDataChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT_NAME));
  }
}

export function onDataChanged(handler: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}
