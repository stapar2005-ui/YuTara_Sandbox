// Setup mock browser environment (window, localStorage, events)
class MockLocalStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.get(key) ?? null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
  get length() {
    return this.store.size;
  }
  key(index) {
    return Array.from(this.store.keys())[index] ?? null;
  }
}

const mockStorage = new MockLocalStorage();
const eventListeners = {};

globalThis.window = {
  localStorage: mockStorage,
  dispatchEvent: (event) => {
    const list = eventListeners[event.type] || [];
    list.forEach((cb) => cb(event));
    return true;
  },
  addEventListener: (type, listener) => {
    if (!eventListeners[type]) eventListeners[type] = [];
    eventListeners[type].push(listener);
  },
  removeEventListener: (type, listener) => {
    if (!eventListeners[type]) return;
    eventListeners[type] = eventListeners[type].filter((l) => l !== listener);
  },
};

globalThis.Event = class Event {
  constructor(type) {
    this.type = type;
  }
};

// Immediate error response for Supabase endpoints to bypass fetchWithRetry exponential backoff
// and immediately engage SupabaseAdapter's graceful LocalStorage fallback.
globalThis.fetch = async (input, init) => {
  return new Response(
    JSON.stringify({ message: "sandbox_offline_fallback" }),
    {
      status: 400,
      statusText: "Bad Request",
      headers: { "Content-Type": "application/json" },
    }
  );
};
