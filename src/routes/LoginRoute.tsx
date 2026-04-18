import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Stack,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Alert,
  Center,
  Paper,
  Anchor,
} from '@mantine/core';
import { signIn, signUp, confirmSignUp, getCurrentUser } from 'aws-amplify/auth';

type Phase = 'credentials' | 'confirm';
type Mode = 'signin' | 'signup';

export default function LoginRoute() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('signin');

  useEffect(() => {
    getCurrentUser()
      .then(() => navigate('/map', { replace: true }))
      .catch(() => {});
  }, [navigate]);
  const [phase, setPhase] = useState<Phase>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitCredentials() {
    setBusy(true);
    setError(null);
    try {
      const normalized = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
        throw new Error('Enter a valid email address');
      }
      if (mode === 'signin') {
        await signIn({ username: normalized, password });
        navigate('/map', { replace: true });
      } else {
        await signUp({
          username: normalized,
          password,
          options: { userAttributes: { email: normalized } },
        });
        setPhase('confirm');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  async function submitConfirmation() {
    setBusy(true);
    setError(null);
    try {
      await confirmSignUp({ username: email.trim().toLowerCase(), confirmationCode: code });
      await signIn({ username: email.trim().toLowerCase(), password });
      navigate('/map', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setBusy(false);
    }
  }

  function toggleMode() {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
    setError(null);
  }

  return (
    <Center mih="100svh" p="md">
      <Paper withBorder p="xl" radius="md" w={420} maw="100%">
        <Stack>
          <Title order={2}>Welcome to Blob-o-dads</Title>
          {phase === 'credentials' && (
            <>
              <Text c="dimmed" size="sm">
                {mode === 'signin' ? 'Sign in to your account.' : 'Create a new account.'}
              </Text>
              <TextInput
                label="Email address"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                type="email"
                autoFocus
                disabled={busy}
              />
              <PasswordInput
                label="Password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                disabled={busy}
              />
              {error && <Alert color="red">{error}</Alert>}
              <Button
                onClick={submitCredentials}
                loading={busy}
                disabled={!email || !password}
                fullWidth
              >
                {mode === 'signin' ? 'Sign in' : 'Create account'}
              </Button>
              <Text size="sm" ta="center">
                {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                <Anchor component="button" onClick={toggleMode}>
                  {mode === 'signin' ? 'Sign up' : 'Sign in'}
                </Anchor>
              </Text>
            </>
          )}
          {phase === 'confirm' && (
            <>
              <Text c="dimmed" size="sm">
                We sent a verification code to {email}. Enter it below to confirm your account.
              </Text>
              <TextInput
                label="Verification code"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.currentTarget.value)}
                autoFocus
                disabled={busy}
              />
              {error && <Alert color="red">{error}</Alert>}
              <Button
                onClick={submitConfirmation}
                loading={busy}
                disabled={!code}
                fullWidth
              >
                Confirm account
              </Button>
              <Button
                variant="subtle"
                onClick={() => {
                  setPhase('credentials');
                  setCode('');
                  setError(null);
                }}
                disabled={busy}
              >
                Back
              </Button>
            </>
          )}
        </Stack>
      </Paper>
    </Center>
  );
}
