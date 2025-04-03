// firebase-config.js
// Importe os serviços necessários da versão compatível
if (!firebase.apps.length) {
  firebase.initializeApp({
    apiKey: "AIzaSyA7hNK-EeYu3TI3Rh5KHdNxIberYwc9wDk",
    authDomain: "cara-a-cara-online.firebaseapp.com",
    databaseURL: "https://cara-a-cara-online-default-rtdb.firebaseio.com",
    projectId: "cara-a-cara-online",
    storageBucket: "cara-a-cara-online.firebasestorage.app",
    messagingSenderId: "200760352191",
    appId: "1:200760352191:web:856f2265b60d551eab550a",
  });
}

const auth = firebase.auth();
const database = firebase.database();
