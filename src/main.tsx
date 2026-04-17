import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';

import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { configureAmplify } from './lib/amplify';
import './index.css';

configureAmplify();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider defaultColorScheme="auto">
      <ModalsProvider>
        <Notifications position="top-right" />
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </ModalsProvider>
    </MantineProvider>
  </StrictMode>,
);
