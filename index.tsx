
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// This app uses localforage for IndexedDB, recharts for charts, and react-router-dom for routing.
// Make sure to install them:
// npm install localforage recharts react-router-dom
// npm install @types/localforage @types/react-router-dom --save-dev

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js");
  });
}