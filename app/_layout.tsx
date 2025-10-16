import { Stack } from "expo-router";
import { observer } from "mobx-react-lite";
import React from "react";
import { StatusBar, useColorScheme } from "react-native";

function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar />
    </>
  );
}

export default observer(TabLayout);
