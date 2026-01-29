import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuração padrão/placeholder se não houver variáveis de ambiente
// Isso evita que o app quebre completamente se não estiver configurado
const defaultFirebaseConfig = {
    apiKey: "API_KEY_PLACEHOLDER",
    authDomain: "project-id.firebaseapp.com",
    projectId: "project-id",
    storageBucket: "project-id.appspot.com",
    messagingSenderId: "sender-id",
    appId: "app-id"
};

let app;
let auth;
let db;
let storage;
let appId = 'default-app-id';

try {
    let firebaseConfig;

    // 1. Tenta pegar da configuração injetada globalmente (ex: builds antigos)
    if (typeof window !== 'undefined' && window.__firebase_config) {
        firebaseConfig = JSON.parse(window.__firebase_config);
        if (window.__app_id) appId = window.__app_id;
    }
    // 2. Tenta pegar das variáveis de ambiente (Vite)
    else if (import.meta.env.VITE_FIREBASE_API_KEY) {
        firebaseConfig = {
            apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
            storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
            appId: import.meta.env.VITE_FIREBASE_APP_ID
        };
    }
    // 3. Fallback
    else {
        console.warn("Configuração do Firebase não encontrada. Usando valores placeholder.");
        console.warn("Verifique se o arquivo .env.local existe e está preenchido corretamente.");
        firebaseConfig = defaultFirebaseConfig;
    }

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);

    console.log("Firebase inicializado com sucesso:", firebaseConfig.projectId);

} catch (e) {
    console.error("Erro CRÍTICO ao inicializar Firebase:", e);
    // Inicialização de emergência para não quebrar imports
    app = initializeApp(defaultFirebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
}

export { app, auth, db, storage, appId };
