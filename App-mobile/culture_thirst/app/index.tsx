import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { ref, onValue } from "firebase/database";
import { auth, rtdb } from "./firebaseConfig";
import { router } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import QRScanner from "./components/QRScanner";
// Composant principal de l'écran d'accueil avec les classements
// Interfaces pour les données
interface Student {
  id: string;
  displayName: string;
  bottles: number;
  schoolName: string;
}

interface School {
  id: string;
  name: string;
  bottles: number;
}

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [schools, setSchools] = useState<School[]>([]);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/auth/login");
      } else {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Charger les classements depuis Firebase
  useEffect(() => {
    // Charger le classement des étudiants
    const studentsRef = ref(rtdb, "leaderboard/students");
    const unsubStudents = onValue(studentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const studentsList: Student[] = Object.entries(data).map(
          ([id, value]: [string, any]) => ({
            id,
            displayName: value.displayName || "Inconnu",
            bottles: value.bottles || 0,
            schoolName: value.schoolName || "",
          })
        );
        // Trier par nombre de bouteilles (décroissant)
        studentsList.sort((a, b) => b.bottles - a.bottles);
        setStudents(studentsList);
      } else {
        setStudents([]);
      }
    });

    // Charger le classement des écoles
    const schoolsRef = ref(rtdb, "leaderboard/schools");
    const unsubSchools = onValue(schoolsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const schoolsList: School[] = Object.entries(data).map(
          ([id, value]: [string, any]) => ({
            id,
            name: value.name || "Inconnu",
            bottles: value.bottles || 0,
          })
        );
        // Trier par nombre de bouteilles (décroissant)
        schoolsList.sort((a, b) => b.bottles - a.bottles);
        setSchools(schoolsList);
      } else {
        setSchools([]);
      }
      setLoadingData(false);
    });

    return () => {
      unsubStudents();
      unsubSchools();
    };
  }, []);

  if (loading || loadingData) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, currentTab === 0 && styles.activeTab]}
            onPress={() => setCurrentTab(0)}
          >
            <Text
              style={[styles.tabText, currentTab === 0 && styles.activeTabText]}
            >
              Students
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, currentTab === 1 && styles.activeTab]}
            onPress={() => setCurrentTab(1)}
          >
            <Text
              style={[styles.tabText, currentTab === 1 && styles.activeTabText]}
            >
              Schools
            </Text>
          </TouchableOpacity>
        </View>

        {/* Liste des classements */}
        <View style={styles.listContainer}>
          {currentTab === 0 ? (
            students.length > 0 ? (
              <FlatList
                data={students}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                  <View style={styles.listItem}>
                    <Text style={styles.rank}>{index + 1}</Text>
                    <Text style={styles.username}>{item.displayName}</Text>
                    <Text style={styles.bottles}>{item.bottles} bouteilles</Text>
                  </View>
                )}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Aucun étudiant dans le classement</Text>
              </View>
            )
          ) : schools.length > 0 ? (
            <FlatList
              data={schools}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <View style={styles.listItem}>
                  <Text style={styles.rank}>{index + 1}</Text>
                  <Text style={styles.username}>{item.name}</Text>
                  <Text style={styles.bottles}>{item.bottles} bouteilles</Text>
                </View>
              )}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucun établissement dans le classement</Text>
            </View>
          )}
        </View>

        {/* Bouton flottant pour scanner */}
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => setScannerVisible(true)}
        >
          <FontAwesome name="camera" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Barre de navigation */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.push("/")}>
            <FontAwesome name="home" size={28} color="#2e78b7" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/profile")}>
            <FontAwesome name="user" size={28} color="gray" />
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
  tabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  tab: {
    flex: 1,
    padding: 16,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#2e78b7",
  },
  tabText: {
    fontSize: 16,
    color: "gray",
  },
  activeTabText: {
    color: "#2e78b7",
    fontWeight: "bold",
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    marginBottom: 8,
    borderRadius: 8,
    elevation: 2,
  },
  rank: {
    fontWeight: "bold",
    fontSize: 16,
  },
  username: {
    fontSize: 16,
    flex: 1,
    marginLeft: 8,
  },
  bottles: {
    fontSize: 16,
    color: "green",
  },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  scanButton: {
    position: "absolute",
    bottom: 80,
    right: 20,
    backgroundColor: "#2e78b7",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});