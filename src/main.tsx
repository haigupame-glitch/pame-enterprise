import React, {StrictMode, Component, ErrorInfo} from 'react';
import {createRoot} from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App from './App.tsx';
import { AppProvider } from './store/AppContext';
import './index.css';

// Catch global errors before React
window.addEventListener('error', (event) => {
  const root = document.getElementById('root');
  if (root && root.innerHTML === '') {
    root.innerHTML = `<div style="color:red; padding:20px; background:black; min-height:100vh;">
      <h2>Fatal Error</h2>
      <pre>${event.error?.stack || event.message}</pre>
    </div>`;
  }
});
window.addEventListener('unhandledrejection', (event) => {
  const root = document.getElementById('root');
  if (root && root.innerHTML === '') {
    root.innerHTML = `<div style="color:red; padding:20px; background:black; min-height:100vh;">
      <h2>Unhandled Promise Rejection</h2>
      <pre>${event.reason?.stack || event.reason}</pre>
    </div>`;
  }
});

class ErrorBoundary extends React.Component<any, {hasError: boolean, error: any}> {
  props: any;
  state = { hasError: false, error: null };
  constructor(props: any) {
    super(props);
    this.props = props;
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 max-w-2xl w-full">
            <h2 className="text-xl font-semibold text-red-400 mb-4">Something went wrong.</h2>
            <div className="bg-black/50 p-4 rounded-lg overflow-auto">
              <pre className="text-sm font-mono text-red-300 whitespace-pre-wrap mb-4">{this.state.error?.toString()}</pre>
              <pre className="text-xs font-mono text-slate-400 whitespace-pre-wrap">{this.state.error?.stack}</pre>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-6 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AppProvider>
        <App />
        <Analytics />
      </AppProvider>
    </ErrorBoundary>
  </StrictMode>,
);
