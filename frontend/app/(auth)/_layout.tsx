import { COLORS } from "@/constants/theme";
import { Stack } from "expo-router";
import React from "react";

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
      <Stack.Screen name="welcome" options={{ animation: "fade" }} />
      <Stack.Screen name="permissions" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="login" options={{ animation: "slide_from_right" }} />
    </Stack>
  );
}
