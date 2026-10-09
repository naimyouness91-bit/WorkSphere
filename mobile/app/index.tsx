import { Redirect } from 'expo-router'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useAuth } from '../src/context/AuthContext'
import { useTheme } from '../src/context/ThemeContext'

export default function Index() {
  const { user, loading } = useAuth()
  const { colors } = useTheme()

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primaryLight} />
      </View>
    )
  }

  if (user) {
    return <Redirect href="/(tabs)" />
  }

  return <Redirect href="/login" />
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
})
