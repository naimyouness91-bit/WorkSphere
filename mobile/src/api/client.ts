import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

const baseURL = process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:8765/api'

export const api = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('access_token')
    }
    return Promise.reject(error)
  },
)
