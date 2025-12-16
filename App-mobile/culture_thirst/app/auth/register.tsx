import React, { useState } from "react";
import {
  View,
  TextInput,
  Button,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { getDatabase, ref, set } from "firebase/database";
import { useRouter } from "expo-router";
import { auth } from "../firebaseConfig";

export default function Register() {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRegister = async () => {
    setError("");

    // Validation
    if (!email.trim() || !password || !displayName.trim() || !schoolName.trim()) {
      setError("Tous les champs sont requis");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const userId = userCredential.user.uid;

      const db = getDatabase();
      await set(ref(db, `users/students/${userId}`), {
        email: email.trim(),
        displayName: displayName.trim(),
        schoolName: schoolName.trim(),
        bottlesRecycled: 0,
        partialLiters: 0,
        bestRank: null,
        unlockedPoems: [],
        createdAt: Date.now(),
      });

      // Initialiser l'entrée dans le leaderboard des étudiants (utilise schoolName)
      await set(ref(db, `leaderboard/students/${userId}`), {
        bottles: 0,
        displayName: displayName.trim(),
        schoolName: schoolName.trim(),
      });

      router.replace("/");
    } catch (e: any) {
      const msg = e?.message || "Erreur lors de l'inscription";
      setError(msg);
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

          <Text style={styles.title}>Inscription</Text>

          <TextInput
            placeholder="Nom d'affichage"
            placeholderTextColor="#666"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
            style={styles.input}
          />

          <TextInput
            placeholder="Email"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />

          <TextInput
            placeholder="Nom de l'établissement"
            placeholderTextColor="#666"
            value={schoolName}
            onChangeText={setSchoolName}
            autoCapitalize="words"
            style={styles.input}
          />

          <TextInput
            placeholder="Mot de passe"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />

          <Button title="S'inscrire" onPress={handleRegister} />
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.footer}>
            <Text style={styles.link} onPress={() => router.back()}>
              Déjà un compte ? Se connecter
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