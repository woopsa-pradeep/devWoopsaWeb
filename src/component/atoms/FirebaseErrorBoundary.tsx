import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class FirebaseErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error info
    console.warn('Firebase Error Boundary caught an error:', error, errorInfo);
    
    // Check if this is a Firebase-related error
    const isFirebaseError = 
      error.message.includes('Firebase') ||
      error.message.includes('messaging') ||
      error.message.includes('addEventListener') ||
      error.message.includes('serviceWorker') ||
      error.message.includes('Notification') ||
      error.message.includes('PushManager');

    if (isFirebaseError) {
      // For Firebase errors, we can continue with the app
      // but disable Firebase features
      console.warn('Firebase error detected, continuing without Firebase features');
      this.setState({ hasError: false });
    } else {
      // For other errors, show the error boundary
      this.setState({ hasError: true, error, errorInfo });
    }
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '1px solid #ffcdd2',
          borderRadius: '8px',
          backgroundColor: '#ffebee',
          color: '#c62828'
        }}>
          <h3>Something went wrong</h3>
          <p>We encountered an error while loading the application.</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            style={{
              padding: '8px 16px',
              backgroundColor: '#c62828',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginTop: '20px' }}>
              <summary>Error Details (Development)</summary>
              <pre style={{ 
                backgroundColor: '#f5f5f5', 
                padding: '10px', 
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '12px'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default FirebaseErrorBoundary;
