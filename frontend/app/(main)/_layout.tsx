import { Stack } from "expo-router";

export default function MainLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: {
          backgroundColor: "#fff",
        },
      }}
    >
      {/* Optional: explicitly define screens if you want control */}
      <Stack.Screen name="processing" />
      <Stack.Screen name="results" />
      <Stack.Screen name="dropoff" />
    </Stack>
  );
}