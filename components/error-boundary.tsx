'use client';

import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <Card className="mx-auto mt-10 max-w-md border-rose-200">
          <CardContent className="py-8 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-rose-400" />
            <h2 className="mt-3 text-lg font-semibold text-slate-900">Algo salió mal</h2>
            <p className="mt-1 text-sm text-slate-500">
              {this.state.error?.message ?? 'Error inesperado'}
            </p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Intentar de nuevo
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
