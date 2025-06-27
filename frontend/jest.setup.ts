beforeAll(() => {
  localStorage.setItem('apiToken', 'test-token');
});

// JSDOM ne gère pas ResizeObserver, nécessaire pour Recharts
beforeAll(() => {
  if (typeof window !== 'undefined' && !('ResizeObserver' in window)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});
