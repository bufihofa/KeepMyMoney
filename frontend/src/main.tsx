import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { App } from './app/App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
      <Toaster
        position="bottom-center"
        offset={92}
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
