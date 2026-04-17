import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Alert, Box, Button, Stack } from '@mantine/core';

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught render error', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <Box p="md">
          <Stack>
            <Alert color="red" title="Something went wrong">
              {this.state.error.message}
            </Alert>
            <Button onClick={() => window.location.reload()}>Reload</Button>
          </Stack>
        </Box>
      );
    }
    return this.props.children;
  }
}
