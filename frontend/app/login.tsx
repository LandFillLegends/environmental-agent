import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import { makeRedirectUri } from 'expo-auth-session'
import { supabase } from '../lib/supabase'

WebBrowser.maybeCompleteAuthSession()

const getRedirectUrl = () => {
  if (Platform.OS === 'web') {
    // Use Vercel URL in production, localhost in development
    return __DEV__
      ? 'http://localhost:8081'
      : 'https://your-app.vercel.app'  // 🔁 replace with your actual Vercel URL
  }
  // Mobile: use Expo's redirect URI
  return makeRedirectUri()
}

export default function LoginScreen() {
  const handleGoogleLogin = async () => {
    const redirectUrl = getRedirectUrl()

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: Platform.OS !== 'web',
      },
    })

    if (error) console.error(error)
    if (!data?.url) return

    if (Platform.OS === 'web') {
      // On web, redirect directly in the browser
      window.location.href = data.url
    } else {
      // On mobile, open in-app browser
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl)
      if (result.type === 'success') {
        await supabase.auth.exchangeCodeForSession(result.url)
      }
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={handleGoogleLogin}>
        <Text style={styles.buttonText}>Sign in with Google</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#4285F4',
    padding: 16,
    borderRadius: 8,
    width: 250,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
})