import { useEffect, useState } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from '../../amplify/data/resource';
import { client } from '../lib/dataClient';

type AuthUser = { userId: string; username: string };
type Profile = Schema['User']['type'];

export type Me = {
  auth: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

// Returns the signed-in Cognito identity + their User row (if onboarded).
// `profile` is null while the user is onboarding.
export function useMe(): Me {
  const [auth, setAuth] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAuth = async () => {
    try {
      const u = await getCurrentUser();
      setAuth({ userId: u.userId, username: u.username });
      return u.userId;
    } catch {
      setAuth(null);
      setLoading(false);
      return null;
    }
  };

  const loadProfile = async (userId: string) => {
    const res = await client.models.User.list({
      filter: { userId: { eq: userId } },
      limit: 1,
    });
    setProfile(res.data[0] ?? null);
    setLoading(false);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      const uid = await loadAuth();
      if (!alive || !uid) return;
      await loadProfile(uid);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!auth) return;
    // Live-update the profile when name changes.
    const sub = client.models.User.observeQuery({
      filter: { userId: { eq: auth.userId } },
    }).subscribe({
      next: ({ items }) => setProfile(items[0] ?? null),
    });
    return () => sub.unsubscribe();
  }, [auth]);

  return {
    auth,
    profile,
    loading,
    refreshProfile: async () => {
      if (auth) await loadProfile(auth.userId);
    },
  };
}
