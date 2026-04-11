import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Session } from '@supabase/supabase-js'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { Platform, useColorScheme } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import 'react-native-reanimated'
import { supabase } from '../lib/supabase'
import { storeGoogleTokens } from '@/services/api'

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

    const inAuthGroup = segments[0] === '(auth)'
    const bypassAuth = process.env.EXPO_PUBLIC_BYPASS_AUTH === 'true'

    if (!bypassAuth && !session && !inAuthGroup) {
      router.replace('/(auth)/welcome')
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)/home')
    }
  }, [session, initialized, segments])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(main)" options={{ headerShown: false }} />
          <Stack.Screen name="camera" options={{ presentation: 'fullScreenModal', headerShown: false }} />
          <Stack.Screen name="loading" options={{ presentation: 'fullScreenModal', headerShown: false }} />
          <Stack.Screen name="facility-map" options={{ presentation: 'fullScreenModal', headerShown: false }} />
          <Stack.Screen name="schedule-dropoff" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}