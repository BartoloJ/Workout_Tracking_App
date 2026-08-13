export function registerServiceWorker() {
  if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'development') {
    window.addEventListener('load', () => {
      const swUrl = `${import.meta.env.BASE_URL}sw.js`;
      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log('Workout Tracker SW registered successfully:', registration.scope);
        })
        .catch((error) => {
          console.warn('Workout Tracker SW registration failed:', error);
        });
    });
  }
}
