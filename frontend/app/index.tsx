import React from "react";
import { Redirect } from "expo-router";
import { useAppStore } from "@/store/useAppStore";

export default function Index() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  return isAuthenticated ? (
    <Redirect href="/(tabs)/home" />
  ) : (
    <Redirect href="/(auth)/welcome" />
  );
}
