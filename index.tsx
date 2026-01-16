import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initApiHarness } from './services/apiHarness';

// V3.4: Establish API Interceptor before React renders
initApiHarness();

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
