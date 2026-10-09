import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import App from './App.tsx'
import { ThemeProvider } from './context/ThemeContext'
import NotificationToast from './components/NotificationToast.tsx'
import './lib/fontawesome'
import './i18n'
import './index.css'
import { store } from './store'
import { registerSW } from 'virtual:pwa-register'
import { initSentry } from './lib/sentry'

initSentry()
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <NotificationToast />
        <App />
      </ThemeProvider>
    </Provider>
  </StrictMode>,
)
