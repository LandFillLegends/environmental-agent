import { useEffect, useState } from 'react'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useColorScheme, Platform } from 'react-native'
import { supabase } from '../lib/supabase'
import { Session } from '@supabase/supabase-js'
import 'react-native-reanimated'

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
      (_event, session) => {
        setSession(session)
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
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}

 /* useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setInitialized(true)
    })
  */
