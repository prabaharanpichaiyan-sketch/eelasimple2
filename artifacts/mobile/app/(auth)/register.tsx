import { showAlert } from '@/lib/dialog';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterScreen() {
  const colors = useColors();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'owner' | 'staff'>('owner');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!fullName || !email || !password) {
      showAlert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      showAlert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await signUp(email.trim().toLowerCase(), password, fullName.trim(), role);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert('Account created', 'Check your email to verify your account, then sign in.');
      router.back();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      showAlert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Join your bakery team</Text>
        </View>

        <View style={styles.form}>
          <View>
            <Text style={[styles.label, { color: colors.foreground }]}>Full Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Your full name"
              placeholderTextColor={colors.mutedForeground}
              value={fullName}
              onChangeText={setFullName}
              autoComplete="name"
              textContentType="name"
            />
          </View>
          <View>
            <Text style={[styles.label, { color: colors.foreground }]}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="you@example.com"
              placeholderTextColor={colors.mutedForeground}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
            />
          </View>
          <View>
            <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Min. 6 characters"
              placeholderTextColor={colors.mutedForeground}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="newPassword"
            />
          </View>

          <View>
            <Text style={[styles.label, { color: colors.foreground }]}>Role</Text>
            <View style={styles.roleRow}>
              {(['owner', 'staff'] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.roleBtn,
                    {
                      borderColor: role === r ? colors.primary : colors.border,
                      backgroundColor: role === r ? colors.primary + '15' : colors.card,
                    },
                  ]}
                  onPress={() => setRole(r)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.roleBtnText, { color: role === r ? colors.primary : colors.mutedForeground }]}>
                    {r === 'owner' ? 'Bakery Owner' : 'Staff'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 60 },
  back: { marginBottom: 24 },
  backText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  subtitle: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  form: { gap: 16 },
  label: { fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  roleRow: { flexDirection: 'row', gap: 10 },
  roleBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  roleBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  button: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});
