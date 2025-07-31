import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ToastProvider } from './modals/ToastProvider';
import Modal from 'react-modal';  // import react-modal

Modal.setAppElement('#root');  // <-- Add this line here ONCE globally

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
);

reportWebVitals();
