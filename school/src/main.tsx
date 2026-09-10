import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/index.css';

async function enableMocking() {
  // Default to mocks ON for this prototype; only skip when explicitly disabled.
  if (import.meta.env.VITE_ENABLE_MOCKS === 'false') {
    return;
  }
  const { worker } = await import('./mocks/browser');
  // `onUnhandledRequest: 'bypass'` lets non-mocked assets load normally.
  return worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
  });
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
