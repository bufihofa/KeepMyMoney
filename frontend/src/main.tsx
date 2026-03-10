import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { App } from './app/App';
import { Capacitor } from '@capacitor/core';
import './styles/index.css';

if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add('is-native');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
      <Toaster
        position="top-center"
        offset={20}
        toastOptions={{
          className: 'sonner-toast',
          duration: 3000,
        }}
        theme="dark"
        richColors
        closeButton
      />
    </BrowserRouter>
  </React.StrictMode>,
);
