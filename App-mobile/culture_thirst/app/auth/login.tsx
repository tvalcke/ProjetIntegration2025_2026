import React, { useState } from "react";
import {
  View,
  TextInput,
  Button,
  Text,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { router } from "expo-router";
import { auth } from "../firebaseConfig";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      console.log("Login successful");
      router.replace("/");
    } catch (e: any) {
      console.error("Login error:", e);
      setError(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* En-tête avec nom de l'app et slogan */}
          <View style={styles.header}>
            <Text style={styles.appName}>JEMLO</Text>
            <Text style={styles.slogan}>soif de culture</Text>
          </View>

          <Text style={styles.title}>Connexion</Text>
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          <TextInput
            placeholder="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Button title="Se connecter" onPress={handleLogin} />
          )}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.footer}>
            <Text style={styles.link} onPress={() => router.push("/auth/register")}>
              Pas de compte ? S'inscrire
            </Text>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  appName: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#00CED1", // Couleur aqua
    letterSpacing: 2,
  },
  slogan: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
    marginTop: 8,
  },
  title: {
    fontSize: 20,
    marginBottom: 16,
    textAlign: "center",
    fontWeight: "600",
  },
  input: {
    marginVertical: 8,
    borderWidth: 1,
    padding: 12,
    borderRadius: 4,
    borderColor: "#ddd",
    fontSize: 16,
  },
  error: {
    color: "red",
    marginTop: 8,
    textAlign: "center",
  },
  footer: {
    marginTop: 16,
    alignItems: "center",
  },
  link: {
    color: "#2e78b7",
  },
});