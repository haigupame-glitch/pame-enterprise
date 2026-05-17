import {StrictMode, Component, ErrorInfo} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AppProvider } from './store/AppContext';
import './index.css';

class ErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
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
      </AppProvider>
    </ErrorBoundary>
  </StrictMode>,
);
