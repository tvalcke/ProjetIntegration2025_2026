import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";
import { router } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import QRScanner from "./components/QRScanner";
import { getDatabase, ref, onValue, off } from "firebase/database";

interface UserData {
  email: string;
  displayName: string;
  schoolName: string;
  bottlesRecycled: number;
  partialLiters: number;
  bestRank: number | null;
  unlockedPoems: string[];
}

interface Poem {
  id: string;
  title: string;
  firstLine: string;
}

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [poems, setPoems] = useState<Poem[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/auth/login");
      } else {
        setLoading(false);
        // Charger les données utilisateur
        const db = getDatabase();
        const userRef = ref(db, `users/students/${user.uid}`);
        
        const userListener = onValue(userRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setUserData(data);
          }
        });

        // Écouter les mises à jour des données utilisateur pour récupérer unlockedPoems
        const poemsListener = onValue(userRef, async (snapshot) => {
          const userData = snapshot.val();
          if (userData && userData.unlockedPoems && userData.unlockedPoems.length > 0) {
            const poemsArray: Poem[] = [];
            
            // Récupérer les détails de chaque poème
            for (const poemId of userData.unlockedPoems) {
              const poemRef = ref(db, `poems/${poemId}`);
              onValue(poemRef, (poemSnapshot) => {
                const poemData = poemSnapshot.val();
                if (poemData) {
                  poemsArray.push({
                    id: poemId,
                    title: poemData.title || "Poème",
                    firstLine: poemData.firstLine || "premier vers",
                  });
                }
              }, { onlyOnce: true });
            }
            
            setPoems(poemsArray);
          } else {
            setPoems([]);
          }
        });

        return () => {
          off(userRef);
        };
      }
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Profil</Text>
          <Text style={styles.email}>{userData?.displayName || "Utilisateur"}</Text>
          <Text style={styles.schoolName}>{userData?.schoolName || ""}</Text>
          <Text style={styles.stat}>Bouteilles recyclées : {userData?.bottlesRecycled || 0}</Text>
          <Text style={styles.stat}>
            Meilleur classement : {userData?.bestRank ? `${userData.bestRank}ème` : "Non classé"}
          </Text>
          
          {/* Bouton scanner dans le header */}
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => setScannerVisible(true)}
          >
            <FontAwesome name="camera" size={24} color="#fff" />
            <Text style={styles.scanButtonText}>Scanner une fontaine</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Poèmes débloqués ({userData?.unlockedPoems?.length || 0})</Text>
        {poems.length > 0 ? (
          <FlatList
            data={poems}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.poemItem}>
                <Text style={styles.poemTitle}>{item.title}</Text>
                <Text style={styles.poemFirstLine}>{item.firstLine}</Text>
              </View>
            )}
            style={styles.poemsList}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucun poème débloqué pour le moment</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => router.push("/auth/logout")}
        >
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

        {/* Barre de navigation */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.push("/")}>
            <FontAwesome name="home" size={28} color="gray" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/profile")}>
            <FontAwesome name="user" size={28} color="#2e78b7" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scanner QR Code */}
      <QRScanner
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  email: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  schoolName: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  stat: {
    fontSize: 14,
    marginVertical: 4,
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2e78b7",
    padding: 14,
    borderRadius: 8,
    marginTop: 16,
    gap: 10,
  },
  scanButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    padding: 16,
  },
  poemsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  poemItem: {
    padding: 16,
    backgroundColor: "#fff",
    marginBottom: 8,
    borderRadius: 8,
    elevation: 2,
  },
  poemTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  poemFirstLine: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  logoutButton: {
    backgroundColor: "#d32f2f",
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});