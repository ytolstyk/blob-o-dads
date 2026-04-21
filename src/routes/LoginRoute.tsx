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

type Phase = 'phone' | 'otp';

function toE164(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits[0] === '1') return `+${digits}`;
  if (raw.trim().startsWith('+') && digits.length >= 7) return `+${digits}`;
  return null;
}

export default function LoginRoute() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser()
      .then(() => navigate('/map', { replace: true }))
      .catch(() => {});
  }, [navigate]);

  async function submitPhone() {
    const e164 = toE164(phone);
    if (!e164) {
      setError('Enter a valid phone number (e.g. +1 555 123 4567).');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signIn({
        username: e164,
        options: { authFlowType: 'USER_AUTH', preferredChallenge: 'SMS_OTP' },
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
          {phase === 'phone' && (
            <>
              <Text c="dimmed" size="sm">
                Enter your phone number to receive a one-time code.
              </Text>
              <TextInput
                label="Phone number"
                placeholder="+1 555 123 4567"
                description="US numbers: enter 10 digits. International: include country code."
                value={phone}
                onChange={(e) => setPhone(e.currentTarget.value)}
                type="tel"
                autoFocus
                disabled={busy}
              />
              {error && <Alert color="red">{error}</Alert>}
              <Button
                onClick={submitPhone}
                loading={busy}
                disabled={!phone.trim()}
                fullWidth
              >
                Send code
              </Button>
            </>
          )}
          {phase === 'otp' && (
            <>
              <Text c="dimmed" size="sm">
                We sent a 6-digit code to {phone}. Enter it below.
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
                  setPhase('phone');
                  setCode('');
                  setError(null);
                }}
                disabled={busy}
              >
                ← Change number
              </Anchor>
            </>
          )}
        </Stack>
      </Paper>
    </Center>
  );
}
