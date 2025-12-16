import React from "react";
import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen
        name="auth/login"
        options={{
          title: "Connexion",
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="auth/register"
        options={{
          title: "Inscription",
        }}
      />
      <Stack.Screen
        name="index"
        options={{
          title: "Accueil",
          headerBackVisible: false,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          title: "Profil",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="auth/logout"
        options={{
          title: "Déconnexion",
        }}
      />
    </Stack>
  );
}