import React, { useState } from "react";
import { View, Button, StyleSheet, ActivityIndicator, Text } from "react-native";
import { signOut } from "firebase/auth";
import { useRouter } from "expo-router";
import { auth } from "../firebaseConfig";

export default function Logout() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      router.replace("/auth/login");
    } catch (e) {
      // silent fallback
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? <ActivityIndicator /> : <Button title="Se déconnecter" onPress={handleLogout} />}
      <Text style={styles.note}>Vous serez redirigé vers l'écran de connexion.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 16 },
  note: { marginTop: 12, textAlign: "center", color: "#666" },
});