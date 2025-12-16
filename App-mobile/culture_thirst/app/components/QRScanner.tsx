import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { FontAwesome } from "@expo/vector-icons";
import { ref, set, onValue, off, push } from "firebase/database";
import { rtdb, auth } from "../firebaseConfig";

interface QRScannerProps {
  visible: boolean;
  onClose: () => void;
}

export default function QRScanner({ visible, onClose }: QRScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [waterDispensed, setWaterDispensed] = useState(0);
  const [fountainDepartment, setFountainDepartment] = useState<string | null>(null);
  const [fountainSerial, setFountainSerial] = useState<string | null>(null);

  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
  }, [visible]);

  useEffect(() => {
    if (sessionId && fountainDepartment && fountainSerial) {
      const today = new Date().toISOString().slice(0, 10);
      const fountainRef = ref(rtdb, `/${today}/${fountainDepartment}/${fountainSerial}`);
      
      const unsubscribe = onValue(fountainRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.lastTransaction && data.lastTransaction.waterLiters) {
          const waterFromTransaction = data.lastTransaction.waterLiters;
          setWaterDispensed(waterFromTransaction);
          
          // Appeler handleSessionEnd avec l'eau de lastTransaction
          handleSessionEnd(waterFromTransaction);
        }
      });

      return () => {
        off(fountainRef);
      };
    }
  }, [sessionId, fountainDepartment, fountainSerial]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      // Le QR code contient l'ID de la fontaine au format: DEPARTEMENT + FOUNTAIN_SERIAL
      // Exemple: EPHEC01M02 => DEPARTMENT: EPHEC01, FOUNTAIN_SERIAL: M02
      const fountainId = data;
      
      // Parser le fountainId pour extraire DEPARTMENT et FOUNTAIN_SERIAL
      // On suppose que DEPARTMENT = 6 caractères et FOUNTAIN_SERIAL = reste
      const department = fountainId.substring(0, 6);
      const serial = fountainId.substring(6);
      
      const userId = auth.currentUser?.uid;

      if (!userId) {
        Alert.alert("Erreur", "Utilisateur non authentifié");
        resetScanner();
        return;
      }

      if (!department || !serial) {
        Alert.alert("Erreur", "Format de QR code invalide");
        resetScanner();
        return;
      }

      // Créer une nouvelle session
      const sessionsRef = ref(rtdb, "sessions");
      const newSessionRef = push(sessionsRef);
      const newSessionId = newSessionRef.key;

      if (!newSessionId) {
        Alert.alert("Erreur", "Impossible de créer une session");
        resetScanner();
        return;
      }

      await set(newSessionRef, {
        userId,
        fountainId,
        startTime: Date.now(),
        isActive: true,
        waterDispensed: 0,
      });

      setFountainDepartment(department);
      setFountainSerial(serial);
      setSessionId(newSessionId);
    } catch (error) {
      console.error("Erreur lors du scan:", error);
      Alert.alert("Erreur", "Impossible de démarrer la session");
      resetScanner();
    }
  };

  const handleSessionEnd = async (totalWater: number) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const userRef = ref(rtdb, `users/students/${userId}`);
      
      // Récupérer les données actuelles de l'utilisateur
      onValue(userRef, async (snapshot) => {
        const userData = snapshot.val() || {
          bottlesRecycled: 0,
          partialLiters: 0,
          unlockedPoems: [],
        };

        // Ajouter l'eau débitée à la quantité partielle
        let totalLiters = userData.partialLiters + totalWater;
        let bottlesRecycled = userData.bottlesRecycled;
        let unlockedPoems = userData.unlockedPoems || [];

        // Calculer le nombre de bouteilles complètes
        const newBottles = Math.floor(totalLiters);
        if (newBottles > 0) {
          bottlesRecycled += newBottles;
          totalLiters = totalLiters - newBottles;

          // Débloquer des poèmes (1 poème par bouteille)
          for (let i = 0; i < newBottles; i++) {
            unlockedPoems.push(`poem${bottlesRecycled + i}`);
          }
        }

        // Mettre à jour les données utilisateur
        await set(userRef, {
          ...userData,
          bottlesRecycled,
          partialLiters: totalLiters,
          unlockedPoems,
        });

        Alert.alert(
          "Session terminée",
          `Eau débitée: ${totalWater.toFixed(2)}L\nBouteilles recyclées: ${newBottles}\nPoèmes débloqués: ${newBottles}`,
          [{ text: "OK", onPress: resetScanner }]
        );
      }, { onlyOnce: true });
    } catch (error) {
      console.error("Erreur lors de la fin de session:", error);
      Alert.alert("Erreur", "Impossible de sauvegarder les données");
      resetScanner();
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setSessionId(null);
    setWaterDispensed(0);
    setFountainDepartment(null);
    setFountainSerial(null);
    onClose();
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.container}>
          <Text style={styles.message}>
            Accès à la caméra requis pour scanner le QR code
          </Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Autoriser la caméra</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        {!sessionId ? (
          <>
            <CameraView
              style={styles.camera}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
            />
            <View style={styles.overlay}>
              <Text style={styles.instructions}>
                Scannez le QR code de la fontaine
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.sessionContainer}>
            <FontAwesome name="tint" size={80} color="#2e78b7" />
            <Text style={styles.sessionTitle}>Session active</Text>
            <Text style={styles.waterAmount}>
              {waterDispensed.toFixed(2)} L
            </Text>
            <Text style={styles.sessionSubtitle}>
              Eau débitée en temps réel
            </Text>
          </View>
        )}
        
        <TouchableOpacity style={styles.closeButton} onPress={resetScanner}>
          <FontAwesome name="times" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  instructions: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 16,
    borderRadius: 8,
  },
  message: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#2e78b7",
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 12,
    borderRadius: 30,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  sessionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  sessionTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
  },
  waterAmount: {
    color: "#2e78b7",
    fontSize: 48,
    fontWeight: "bold",
    marginTop: 20,
  },
  sessionSubtitle: {
    color: "#fff",
    fontSize: 16,
    marginTop: 10,
  },
});