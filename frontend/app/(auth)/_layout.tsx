import React from "react";
import { Stack } from "expo-router";
import { COLORS } from "@/constants/theme";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: {
          backgroundColor: COLORS.background,
        },
      }}
    >
      {/* Welcome Screen */}
      <Stack.Screen
        name="welcome"
        options={{
          animation: "fade",
        }}
      />

      {/* Onboarding / Permissions */}
      <Stack.Screen
        name="permissions"
        options={{
          animation: "slide_from_right",
        }}
      />

      {/* Login */}
      <Stack.Screen
        name="login"
        options={{
          animation: "slide_from_right",
        }}
      />
    </Stack>
  );
}

