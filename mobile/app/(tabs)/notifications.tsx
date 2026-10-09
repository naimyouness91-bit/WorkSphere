import { useCallback, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { FontAwesome5 } from '@expo/vector-icons'
import { mobileApi, type AppNotification } from '../../src/api/mobile'
import { useTheme } from '../../src/context/ThemeContext'

const CATEGORY_ICONS: Record<string, React.ComponentProps<typeof FontAwesome5>['name']> = {
  request: 'file-alt',
  payroll: 'money-bill-wave',
  training: 'book-open',
  system: 'bell',
}

export default function NotificationsScreen() {
  const { colors } = useTheme()
  const [items, setItems] = useState<AppNotification[]>([])
  const [unread, setUnread] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const res = await mobileApi.notifications()
    setItems(res.data.data)
    setUnread(res.data.unread_count)
  }, [])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load]),
  )

  const markRead = async (id: number) => {
    await mobileApi.markRead(id)
    await load()
  }

  const markAll = async () => {
    await mobileApi.markAllRead()
    await load()
  }

  const renderItem = ({ item }: { item: AppNotification }) => {
    const icon = CATEGORY_ICONS[item.category] ?? 'bell'
    return (
      <TouchableOpacity
        style={[
          styles.row,
          { backgroundColor: colors.card, borderColor: colors.border },
          !item.read_status && styles.unread,
        ]}
        onPress={() => markRead(item.id)}
      >
        <View style={[styles.iconWrap, { backgroundColor: colors.primary }]}>
          <FontAwesome5 name={icon} size={16} color="#fff" />
        </View>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {item.title ?? item.message}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 13 }} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.meta}>
            {item.category} · {new Date(item.created_at).toLocaleString()}
          </Text>
        </View>
        {!item.read_status && <View style={styles.dot} />}
      </TouchableOpacity>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {unread > 0 && (
        <TouchableOpacity style={styles.markAll} onPress={markAll}>
          <Text style={{ color: colors.primaryLight, fontWeight: '600' }}>Mark all read</Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true)
              await load()
              setRefreshing(false)
            }}
          />
        }
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.muted }]}>No notifications yet.</Text>
        }
        contentContainerStyle={items.length === 0 ? styles.emptyContainer : undefined}
      />
      <Text style={[styles.footer, { color: colors.muted }]}>© WorkSphere 2026</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  markAll: { padding: 12, alignItems: 'flex-end' },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  unread: { borderLeftWidth: 3, borderLeftColor: '#3b82f6' },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: { flex: 1 },
  title: { fontWeight: '600', fontSize: 15, marginBottom: 4 },
  meta: { fontSize: 11, color: '#94a3b8', marginTop: 6 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    marginTop: 6,
  },
  empty: { textAlign: 'center', marginTop: 40 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  footer: { textAlign: 'center', fontSize: 12, padding: 16 },
})
