import { useEffect } from 'react'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { mobileApi } from '../api/mobile'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export function usePushNotifications(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return

    let mounted = true

    async function register() {
      const { status: existing } = await Notifications.getPermissionsAsync()
      let final = existing
      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        final = status
      }
      if (final !== 'granted' || !mounted) return

      try {
        const tokenData = await Notifications.getExpoPushTokenAsync()
        const platform = Platform.OS === 'ios' ? 'ios' : 'android'
        await mobileApi.registerDevice(tokenData.data, platform)
      } catch {
        // Expo push token requires projectId in app.json for production
      }
    }

    register()

    return () => {
      mounted = false
    }
  }, [enabled])
}
