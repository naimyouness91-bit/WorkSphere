import { useEffect, useState } from 'react'
import { View, Text, Switch, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { router } from 'expo-router'
import { mobileApi, type NotificationPreferences } from '../../src/api/mobile'
import { useAuth } from '../../src/context/AuthContext'
import { useTheme } from '../../src/context/ThemeContext'

export default function SettingsScreen() {
  const { user, logout } = useAuth()
  const { colors, isDark, mode, setMode } = useTheme()
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    mobileApi.preferences().then((res) => setPrefs(res.data.data)).catch(() => {})
  }, [])

  const update = async (patch: Partial<NotificationPreferences>) => {
    if (!prefs) return
    setSaving(true)
    try {
      const res = await mobileApi.updatePreferences(patch)
      setPrefs(res.data.data)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await logout()
          router.replace('/login')
        },
      },
    ])
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
        <Text style={{ color: colors.muted }}>{user?.name}</Text>
        <Text style={{ color: colors.muted, fontSize: 13 }}>{user?.email}</Text>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
        {(['light', 'dark', 'system'] as const).map((m) => (
          <TouchableOpacity key={m} style={styles.row} onPress={() => setMode(m)}>
            <Text style={{ color: colors.text, textTransform: 'capitalize' }}>{m}</Text>
            {mode === m && <Text style={{ color: colors.primaryLight }}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

      {prefs && (
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notification preferences</Text>
          {[
            { key: 'push_enabled' as const, label: 'Push notifications' },
            { key: 'in_app_enabled' as const, label: 'In-app notifications' },
            { key: 'email_enabled' as const, label: 'Email notifications' },
          ].map(({ key, label }) => (
            <View style={styles.switchRow} key={key}>
              <Text style={{ color: colors.text, flex: 1 }}>{label}</Text>
              <Switch
                value={prefs[key]}
                onValueChange={(v) => update({ [key]: v })}
                disabled={saving}
              />
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.logout} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign out</Text>
      </TouchableOpacity>

      <Text style={[styles.footer, { color: colors.muted }]}>© WorkSphere 2026</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  logout: {
    backgroundColor: '#dc2626',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutText: { color: '#fff', fontWeight: '600' },
  footer: { textAlign: 'center', fontSize: 12, marginTop: 24, marginBottom: 32 },
})
