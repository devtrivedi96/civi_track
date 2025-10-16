import { Redirect, Stack } from "expo-router";
import { observer } from "mobx-react-lite";
import React from "react";
import { authStore } from "../../stores/authStore";

function AuthLayout() {
  const { authStor } = authStore;

  // If user is authenticated, redirect to main app
  if (authStore.isAuthenticated) {
    return <Redirect href="/(tabs)/Profile" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#fff" },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="admin-login" />
    </Stack>
  );
}

export default observer(AuthLayout);
