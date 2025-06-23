// Importe os módulos do Firebase SDK v9+
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore'; // Adicionado Firestore

// Configuração do Firebase do seu projeto web
// ATENÇÃO: Estas são as credenciais do projeto original.
// Para um novo projeto Firebase, substitua pelas suas credenciais.
const firebaseConfig = {
  apiKey: "AIzaSyA7hNK-EeYu3TI3Rh5KHdNxIberYwc9wDk",
  authDomain: "cara-a-cara-online.firebaseapp.com",
  databaseURL: "https://cara-a-cara-online-default-rtdb.firebaseio.com",
  projectId: "cara-a-cara-online",
  storageBucket: "cara-a-cara-online.firebasestorage.app", // Corrigido: removido .firebasestorage.app duplicado
  messagingSenderId: "200760352191",
  appId: "1:200760352191:web:856f2265b60d551eab550a",
};

// Inicializa o Firebase
// Verifica se já existe uma instância para evitar erros (útil em HMR)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Exporta os serviços do Firebase que você vai usar
const auth = getAuth(app);
const database = getDatabase(app); // Realtime Database
const firestore = getFirestore(app); // Firestore Database

export { app, auth, database, firestore };
