import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { colors, radius, shadow, typography, spacing } from '../../theme/tokens';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        (err?.message === 'Network Error'
          ? 'Cannot reach the server. If it just woke up from sleep, try again in a moment.'
          : 'Login failed. Please check your credentials.');
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <Image source={require('../../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.title}>Waghmare Vikas</Text>
          <Text style={styles.tagline}>Wealth, Vision, Growth</Text>
          <Text style={styles.subtitle}>Sign in to manage borrowers, loans & payments</Text>
        </View>

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          secureTextEntry={secure}
          right={<TextInput.Icon icon={secure ? 'eye' : 'eye-off'} onPress={() => setSecure((s) => !s)} />}
          style={styles.input}
        />

        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>

        <Button mode="contained" onPress={handleLogin} loading={submitting} disabled={submitting} style={styles.button}>
          Sign In
        </Button>

        <Button onPress={() => navigation.navigate('Register')} style={styles.linkButton}>
          Don't have an account? Register
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.xxl },
  header: { marginBottom: spacing.xxxl, alignItems: 'center' },
  logoWrap: {
    width: 96,
    height: 96,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadow.md,
  },
  logo: { width: 66, height: 66 },
  title: { ...typography.h1, color: colors.ink },
  tagline: { ...typography.caption, color: colors.indigo, fontWeight: '700', letterSpacing: 1, marginTop: 4 },
  subtitle: { ...typography.body, color: colors.inkMuted, textAlign: 'center', marginTop: spacing.md },
  input: { marginBottom: spacing.md, backgroundColor: colors.surface },
  button: { marginTop: spacing.sm, paddingVertical: 4 },
  linkButton: { marginTop: spacing.sm },
});
