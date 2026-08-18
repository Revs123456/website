'use client';
import { Component, type ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

/**
 * Last-resort safety net for unhandled render errors.
 *
 * Without this, a thrown error in any client component crashes the whole tree
 * to a blank page. With this, the user sees a friendly recovery prompt.
 *
 * We log to console.error so Vercel/browser devtools capture the stack.
 * Future Phase 7+ work (Sentry) would just plug into componentDidCatch.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    // Structured payload — Sentry/Datadog SDKs ingest this format directly later
    console.error('[ErrorBoundary]', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      url: typeof window !== 'undefined' ? window.location.href : '',
      ts: new Date().toISOString(),
    });
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, background: '#f8fafc',
      }}>
        <div style={{
          maxWidth: 460, textAlign: 'center', padding: 36,
          background: '#fff', borderRadius: 16, border: '1px solid #fecaca',
          boxShadow: '0 12px 40px rgba(15,23,42,0.08)',
        }}>
          <AlertCircle size={36} style={{ color: '#dc2626', margin: '0 auto 14px' }} />
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 22px', lineHeight: 1.6 }}>
            We hit an unexpected error. Refresh, or head back home and try again.
          </p>
          {/* Show error text only in development — production users don't need the stack */}
          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <pre style={{
              textAlign: 'left', fontSize: 11, color: '#dc2626',
              background: '#fef2f2', padding: 12, borderRadius: 8,
              maxHeight: 200, overflow: 'auto', marginBottom: 18, whiteSpace: 'pre-wrap',
            }}>
              {this.state.error.message}
            </pre>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button onClick={this.reset} className="btn btn-outline">
              <RotateCcw size={14} /> Try again
            </button>
            <a href="/" className="btn btn-blue">Go home</a>
          </div>
        </div>
      </div>
    );
  }
}
