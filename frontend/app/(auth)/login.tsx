import { supabase } from '@/lib/supabase';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';

WebBrowser.maybeCompleteAuthSession();

const getRedirectUrl = () => {
  if (Platform.OS === 'web') {
    return __DEV__
      ? 'http://localhost:8081'
      : 'https://environmental-agent-seven.vercel.app';
  }
  return makeRedirectUri();
};

export default function LoginScreen() {
  const handleGoogleLogin = async () => {
    const redirectUrl = getRedirectUrl();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: Platform.OS !== 'web',
      },
    });

    if (error) console.error(error);
    if (!data?.url) return;

    if (Platform.OS === 'web') {
      window.location.href = data.url;
    } else {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      if (result.type === 'success') {
        await supabase.auth.exchangeCodeForSession(result.url);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        {/* Logo */}
        <Image
          source={require('@/assets/images/image.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Copy */}
        <View style={styles.copy}>
          <Text style={styles.headline}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to get personalized disposal guidance</Text>
        </View>

        {/* Google button */}
        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin} activeOpacity={0.85}>
          <Image source={require('@/assets/images/google_image.png')} style={styles.googleIcon} resizeMode="contain" />
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Privacy note */}
        <View style={styles.privacyRow}>
          <Text style={styles.privacyIcon}>◯</Text>
          <Text style={styles.privacyText}>Your data is private and secure</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.xl,
  },

  logo: {
    width: 200,
    height: 200,
  },

  copy: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headline: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  googleButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  googleIcon: {
    width: 22,
    height: 22,
  },
  googleButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },

  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  privacyIcon: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  privacyText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
});
