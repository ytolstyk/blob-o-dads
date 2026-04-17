import { Navigate } from 'react-router';
import { Center, Loader } from '@mantine/core';
import { useMe } from '../hooks/useMe';

export function OnboardedGuard({ children }: { children: React.ReactNode }) {
  const me = useMe();
  if (me.loading) {
    return (
      <Center mih="100svh">
        <Loader />
      </Center>
    );
  }
  if (!me.profile?.onboardedAt) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}
