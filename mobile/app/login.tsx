import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useAuth } from '../src/context/AuthContext'
import { useTheme } from '../src/context/ThemeContext'

export default function LoginScreen() {
  const { login, biometricLogin, biometricAvailable, enableBiometric } = useAuth()
  const { colors, isDark } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      await login(email.trim(), password)
      if (biometricAvailable) {
        Alert.alert(
          'Enable biometric login?',
          'Use fingerprint or Face ID next time?',
          [
            { text: 'Not now', style: 'cancel', onPress: () => router.replace('/(tabs)') },
            {
              text: 'Enable',
              onPress: async () => {
                await enableBiometric(email.trim(), password)
                router.replace('/(tabs)')
              },
            },
          ],
        )
      } else {
        router.replace('/(tabs)')
      }
    } catch {
      setError('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  const handleBiometric = async () => {
    try {
      const ok = await biometricLogin()
      if (ok) router.replace('/(tabs)')
      else setError('Biometric login failed. Sign in with password first.')
    } catch {
      setError('Biometric login unavailable.')
    }
  }

  return (
    <LinearGradient
      colors={isDark ? ['#020617', '#172554', '#1e40af'] : ['#0a1628', '#1e3a8a', '#7dd3fc']}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Image source={require('../assets/splash.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.tagline}>SMART WORKPLACE SOLUTIONS</Text>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>Sign in</Text>

            <Text style={[styles.label, { color: colors.muted }]}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#1e293b' : '#fff' }]}
              placeholder="you@company.com"
              placeholderTextColor={colors.muted}
            />

            <Text style={[styles.label, { color: colors.muted }]}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#1e293b' : '#fff' }]}
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Login'}</Text>
            </TouchableOpacity>

            {biometricAvailable && (
              <TouchableOpacity style={styles.bioButton} onPress={handleBiometric}>
                <Text style={[styles.bioText, { color: colors.primaryLight }]}>Use biometric login</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.footer}>© WorkSphere 2026</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: 48 },
  logo: { width: 160, height: 160, alignSelf: 'center' },
  tagline: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: '600',
    marginBottom: 24,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    fontSize: 15,
  },
  error: { color: '#dc2626', fontSize: 13, marginBottom: 12 },
  button: {
    backgroundColor: '#1e3a8a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  bioButton: { marginTop: 16, alignItems: 'center' },
  bioText: { fontSize: 14, fontWeight: '600' },
  footer: { textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 32 },
})
