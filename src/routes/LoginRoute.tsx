import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Stack,
  Title,
  Text,
  TextInput,
  PinInput,
  Button,
  Alert,
  Center,
  Paper,
} from '@mantine/core';
import {
  signIn,
  signUp,
  confirmSignIn,
  confirmSignUp,
  autoSignIn,
} from 'aws-amplify/auth';

type Phase = 'phone' | 'otp';
type Flow = 'SIGN_IN' | 'SIGN_UP';

// Generates a throwaway Cognito-policy-passing password. Never shown to the user;
// the user authenticates only via SMS OTP. Stored nowhere after signUp.
function throwawayPassword(): string {
  return `T!${crypto.randomUUID()}Aa1`;
}

export default function LoginRoute() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('phone');
  const [flow, setFlow] = useState<Flow>('SIGN_IN');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitPhone() {
    setBusy(true);
    setError(null);
    try {
      const normalized = phone.trim();
      if (!/^\+\d{8,15}$/.test(normalized)) {
        throw new Error('Enter phone in E.164 format, e.g. +14155552671');
      }
      try {
        await signIn({
          username: normalized,
          options: {
            authFlowType: 'USER_AUTH',
            preferredChallenge: 'SMS_OTP',
          },
        });
        setFlow('SIGN_IN');
        setPhase('otp');
      } catch (err) {
        const name = err instanceof Error ? err.name : '';
        if (name === 'UserNotFoundException') {
          await signUp({
            username: normalized,
            password: throwawayPassword(),
            options: {
              userAttributes: { phone_number: normalized },
              autoSignIn: true,
            },
          });
          setFlow('SIGN_UP');
          setPhase('otp');
        } else {
          throw err;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  async function submitCode() {
    setBusy(true);
    setError(null);
    try {
      if (flow === 'SIGN_UP') {
        await confirmSignUp({ username: phone.trim(), confirmationCode: code });
        await autoSignIn();
      } else {
        await confirmSignIn({ challengeResponse: code });
      }
      navigate('/map', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code');
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
                Sign in with your phone. We'll text you a 6-digit code.
              </Text>
              <TextInput
                label="Phone number"
                placeholder="+14155552671"
                value={phone}
                onChange={(e) => setPhone(e.currentTarget.value)}
                type="tel"
                autoFocus
                disabled={busy}
              />
              {error && <Alert color="red">{error}</Alert>}
              <Button onClick={submitPhone} loading={busy} fullWidth>
                Send code
              </Button>
            </>
          )}
          {phase === 'otp' && (
            <>
              <Text c="dimmed" size="sm">
                Enter the 6-digit code we sent to {phone}.
              </Text>
              <PinInput
                length={6}
                type="number"
                oneTimeCode
                value={code}
                onChange={setCode}
                disabled={busy}
              />
              {error && <Alert color="red">{error}</Alert>}
              <Button
                onClick={submitCode}
                loading={busy}
                disabled={code.length < 6}
                fullWidth
              >
                Verify
              </Button>
              <Button
                variant="subtle"
                onClick={() => {
                  setPhase('phone');
                  setCode('');
                  setError(null);
                }}
                disabled={busy}
              >
                Use a different number
              </Button>
            </>
          )}
        </Stack>
      </Paper>
    </Center>
  );
}
