import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Environment } from '@react-three/drei';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onCatch?: (error: Error) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class EnvironmentErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('[EnvironmentErrorBoundary] Caught HDRI loading error:', error.message, errorInfo);
    if (this.props.onCatch) {
      this.props.onCatch(error);
    }
  }

  public componentDidUpdate(prevProps: Props) {
    // Reset error state if children changed
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <Environment files="/brown_photostudio_02_4k.hdr" />;
    }
    return this.props.children;
  }
}
