import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { GoogleAuthProvider } from './contexts/GoogleAuthContext';
import { RestTimerProvider } from './contexts/RestTimerContext';
import { registerServiceWorker } from './registerSW';

registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleAuthProvider>
      <RestTimerProvider>
        <App />
      </RestTimerProvider>
    </GoogleAuthProvider>
  </StrictMode>,
);
