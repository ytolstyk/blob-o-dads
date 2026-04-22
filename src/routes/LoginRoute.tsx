import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Stack,
  Title,
  Text,
  TextInput,
  Button,
  Alert,
  Center,
  Paper,
  Anchor,
} from '@mantine/core';
import { signIn, confirmSignIn, getCurrentUser } from 'aws-amplify/auth';

type Phase = 'email' | 'otp';

export default function LoginRoute() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser()
      .then(() => navigate('/map', { replace: true }))
      .catch(() => {});
  }, [navigate]);

  async function submitEmail() {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signIn({
        username: trimmed,
        options: { authFlowType: 'USER_AUTH', preferredChallenge: 'EMAIL_OTP' },
      });
      setPhase('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send code.');
    } finally {
      setBusy(false);
    }
  }

  async function submitOtp() {
    setBusy(true);
    setError(null);
    try {
      await confirmSignIn({ challengeResponse: code.trim() });
      navigate('/map', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Center mih="100svh" p="md">
      <Paper withBorder p="xl" radius="md" w={420} maw="100%">
        <Stack>
          <Title order={2}>Welcome to Blob-o-dads</Title>
          {phase === 'email' && (
            <>
              <Text c="dimmed" size="sm">
                Enter your email to receive a one-time code.
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
              {error && <Alert color="red">{error}</Alert>}
              <Button
                onClick={submitEmail}
                loading={busy}
                disabled={!email.trim()}
                fullWidth
              >
                Send code
              </Button>
            </>
          )}
          {phase === 'otp' && (
            <>
              <Text c="dimmed" size="sm">
                We sent a 6-digit code to {email}. Enter it below.
              </Text>
              <TextInput
                label="One-time code"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.currentTarget.value)}
                autoFocus
                disabled={busy}
                maxLength={6}
              />
              {error && <Alert color="red">{error}</Alert>}
              <Button
                onClick={submitOtp}
                loading={busy}
                disabled={code.trim().length < 6}
                fullWidth
              >
                Verify
              </Button>
              <Anchor
                component="button"
                size="sm"
                ta="center"
                onClick={() => {
                  setPhase('email');
                  setCode('');
                  setError(null);
                }}
                disabled={busy}
              >
                ← Change email
              </Anchor>
            </>
          )}
        </Stack>
      </Paper>
    </Center>
  );
}
