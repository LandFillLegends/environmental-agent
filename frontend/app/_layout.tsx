import { useEffect, useState } from 'react'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useColorScheme, Platform } from 'react-native'
import { supabase } from '../lib/supabase'
import { Session } from '@supabase/supabase-js'
import 'react-native-reanimated'

const API_BASE_URL = __DEV__
  ? 'http://localhost:8000'
  : process.env.EXPO_PUBLIC_API_URL

// Store Google OAuth tokens in the backend after login
async function storeGoogleTokens(session: Session) {
  if (!session.provider_token) return  // no Google token, skip

  try {
    await fetch(`${API_BASE_URL}/api/v1/users/store-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        google_access_token: session.provider_token,
        google_refresh_token: session.provider_refresh_token ?? null,
      }),
    })
  } catch (e) {
    console.error('Failed to store Google tokens:', e)
  }
}

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null)
  const [initialized, setInitialized] = useState(false)
  const router = useRouter()
  const segments = useSegments()
  const colorScheme = useColorScheme()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setInitialized(true)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)

        // Store Google tokens when user signs in
        if (_event === 'SIGNED_IN' && session) {
          await storeGoogleTokens(session)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Clean up the # from URL after OAuth redirect on web
  useEffect(() => {
    if (initialized && Platform.OS === 'web') {
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [initialized])

  useEffect(() => {
    if (!initialized) return

    const inTabsGroup = segments[0] === '(tabs)'

    if (!session && inTabsGroup) {
      router.replace('/login')   // not logged in → go to login
    } else if (session && !inTabsGroup) {
      router.replace('/(tabs)')  // logged in → go to app
    }
  }, [session, initialized])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          <Stack.Screen name="camera" options={{ presentation: 'fullScreenModal', headerShown: false }} />
          <Stack.Screen name="loading" options={{ presentation: 'fullScreenModal', headerShown: false }} />
          <Stack.Screen name="facility-map" options={{ presentation: 'fullScreenModal', headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}