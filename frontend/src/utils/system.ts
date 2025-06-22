export function handleQuitApp(logoutCallback?: () => void) {
  if (typeof window === 'undefined') return;
  const confirmQuit = window.confirm('Souhaitez-vous vraiment quitter l\u2019application ?');
  if (!confirmQuit) return;

  const isDesktop = navigator.userAgent.includes('Electron');
  if (isDesktop) {
    window.close();
  } else if (logoutCallback) {
    logoutCallback();
  } else {
    window.close();
  }
}
