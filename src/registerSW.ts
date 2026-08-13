export function registerServiceWorker() {
  if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'development') {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Workout Tracker SW registered successfully:', registration.scope);
        })
        .catch((error) => {
          console.warn('Workout Tracker SW registration failed:', error);
        });
    });
  }
}
