import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getDatabase, Database } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBMzQKJiHErPfot7-bk-Mdf0sdcds5qddE",
  authDomain: "fontaine-intelligente.firebaseapp.com", // déduit ; vérifie dans Project settings → Your apps → SDK config
  projectId: "fontaine-intelligente",
  appId: "1:119572491199:ios:7e16631de752b7b39d4f0a",
  databaseURL: "https://fontaine-intelligente-default-rtdb.europe-west1.firebasedatabase.app"
};

const app: FirebaseApp = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const rtdb: Database = getDatabase(app);
export default app;