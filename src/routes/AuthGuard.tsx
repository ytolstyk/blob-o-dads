import { useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { getCurrentUser } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { Center, Loader } from '@mantine/core';

type Status = 'checking' | 'authed' | 'guest';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    let alive = true;
    const check = () => {
      getCurrentUser()
        .then(() => alive && setStatus('authed'))
        .catch(() => alive && setStatus('guest'));
    };
    check();
    const unsub = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signedIn' || payload.event === 'signedOut') check();
    });
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  if (status === 'checking') {
    return (
      <Center mih="100svh">
        <Loader />
      </Center>
    );
  }
  if (status === 'guest') return <Navigate to="/login" replace />;
  return <>{children}</>;
}
