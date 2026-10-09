import { useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { FontAwesome5 } from '@expo/vector-icons'
import { useFocusEffect } from 'expo-router'
import { mobileApi, type MobileDashboard } from '../../src/api/mobile'
import { useAuth } from '../../src/context/AuthContext'
import { useTheme } from '../../src/context/ThemeContext'
import { usePushNotifications } from '../../src/hooks/usePushNotifications'
import { getCachedDashboard, setCachedDashboard, getOfflineQueue, clearOfflineQueue } from '../../src/storage/offline'

function KpiCard({
  label,
  value,
  icon,
  color,
  cardBg,
  textColor,
}: {
  label: string
  value: string | number
  icon: React.ComponentProps<typeof FontAwesome5>['name']
  color: string
  cardBg: string
  textColor: string
}) {
  return (
    <View style={[kpiStyles.card, { backgroundColor: cardBg }]}>
      <View style={[kpiStyles.iconWrap, { backgroundColor: color }]}>
        <FontAwesome5 name={icon} size={18} color="#fff" />
      </View>
      <Text style={[kpiStyles.value, { color: textColor }]}>{value}</Text>
      <Text style={kpiStyles.label}>{label}</Text>
    </View>
  )
}

const kpiStyles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 16,
    padding: 16,
    margin: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  value: { fontSize: 26, fontWeight: '700' },
  label: { fontSize: 12, color: '#64748b', marginTop: 4 },
})

export default function DashboardScreen() {
  const { user } = useAuth()
  const { colors, isDark } = useTheme()
  usePushNotifications(!!user)
  const [data, setData] = useState<MobileDashboard | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [offline, setOffline] = useState(false)

  const load = useCallback(async () => {
    try {
      setOffline(false)
      const queue = await getOfflineQueue()
      if (queue.length > 0) {
        await mobileApi.sync(
          queue.map((a) => ({
            type: a.type,
            payload: a.payload,
            client_id: a.client_id,
          })),
        )
        await clearOfflineQueue()
      }

      const res = await mobileApi.dashboard()
      setData(res.data.data)
      await setCachedDashboard(res.data.data)
    } catch {
      setOffline(true)
      const cached = await getCachedDashboard<MobileDashboard>()
      if (cached) setData(cached.data)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load]),
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const kpis = data?.kpis

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <LinearGradient
        colors={isDark ? ['#0f172a', '#1e3a8a'] : ['#1e3a8a', '#3b82f6']}
        style={styles.hero}
      >
        <Image source={require('../../assets/splash.png')} style={styles.heroLogo} />
        <Text style={styles.heroTitle}>Welcome to WorkSphere – Your Smart Workplace</Text>
        <Text style={styles.heroSub}>Hello {user?.name}</Text>
        {offline && <Text style={styles.offlineBadge}>Offline — showing cached data</Text>}
      </LinearGradient>

      <View style={styles.kpiGrid}>
        <KpiCard
          label="Requests"
          value={kpis?.requests ?? '—'}
          icon="file-alt"
          color="#4f46e5"
          cardBg={colors.card}
          textColor={colors.text}
        />
        <KpiCard
          label="Training"
          value={kpis?.training ?? '—'}
          icon="book-open"
          color="#7c3aed"
          cardBg={colors.card}
          textColor={colors.text}
        />
        <KpiCard
          label="Payroll"
          value={kpis?.payroll ?? '—'}
          icon="money-bill-wave"
          color="#d97706"
          cardBg={colors.card}
          textColor={colors.text}
        />
        <KpiCard
          label="Analytics"
          value={kpis?.analytics ?? '—'}
          icon="chart-bar"
          color="#059669"
          cardBg={colors.card}
          textColor={colors.text}
        />
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick actions</Text>
      <View style={styles.actions}>
        {[
          { label: 'Submit Request', icon: 'plus-circle' as const, hint: 'New internal request' },
          { label: 'Upload Document', icon: 'cloud-upload-alt' as const, hint: 'Open web app' },
          { label: 'View Calendar', icon: 'calendar-alt' as const, hint: 'Events & schedule' },
        ].map((action) => (
          <TouchableOpacity
            key={action.label}
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.85}
          >
            <FontAwesome5 name={action.icon} size={20} color={colors.primaryLight} />
            <View style={styles.actionText}>
              <Text style={[styles.actionLabel, { color: colors.text }]}>{action.label}</Text>
              <Text style={{ color: colors.muted, fontSize: 11 }}>{action.hint}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.footer, { color: colors.muted }]}>© WorkSphere 2026</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  hero: { padding: 20, paddingTop: 8, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  heroLogo: { width: 56, height: 56, marginBottom: 8 },
  heroTitle: { color: '#fff', fontSize: 18, fontWeight: '700', lineHeight: 24 },
  heroSub: { color: 'rgba(255,255,255,0.85)', marginTop: 6, fontSize: 14 },
  offlineBadge: {
    marginTop: 8,
    color: '#fde68a',
    fontSize: 12,
    fontWeight: '600',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    marginTop: -20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  actions: { paddingHorizontal: 12, gap: 10 },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  actionText: { flex: 1 },
  actionLabel: { fontWeight: '600', fontSize: 15 },
  footer: { textAlign: 'center', fontSize: 12, padding: 24 },
})
