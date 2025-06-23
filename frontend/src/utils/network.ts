export async function checkInternetConnection() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    alert('Aucune connexion Internet détectée – certaines fonctionnalités peuvent ne pas fonctionner');
    return false;
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const response = await fetch('https://clients3.google.com/generate_204', {
      method: 'GET',
      cache: 'no-cache',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (response.ok) {
      return true;
    }
    throw new Error('Network response was not ok');
  } catch (_err) {
    alert('Aucune connexion Internet détectée – certaines fonctionnalités peuvent ne pas fonctionner');
    return false;
  }
}
