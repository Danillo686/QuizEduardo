import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit, 
  getDoc,
  setDoc,
  increment
} from "firebase/firestore";

// Insira as credenciais do seu Firebase aqui. 
// Caso as chaves abaixo permaneçam vazias ou com "YOUR_...", o quiz ativará automaticamente o modo LocalStorage (Offline).
const firebaseConfig = {
  apiKey: "AIzaSyCOdhN6btYs6TC3H6ceqiqzde0Ma4FVung",
  authDomain: "quizeduardo-a7c1e.firebaseapp.com",
  projectId: "quizeduardo-a7c1e",
  storageBucket: "quizeduardo-a7c1e.firebasestorage.app",
  messagingSenderId: "247579301520",
  appId: "1:247579301520:web:11ca7e788f9e4d0e046a15",
  measurementId: "G-RZTBJJT9MB"
};

let db = null;
let isFirebaseActive = false;

// Verifica se as configurações do firebase foram preenchidas corretamente
const isValidConfig = firebaseConfig.apiKey && 
                      !firebaseConfig.apiKey.startsWith("YOUR_") && 
                      firebaseConfig.apiKey.trim() !== "";

if (isValidConfig) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    isFirebaseActive = true;
    console.log("🔥 Conectado com sucesso ao Firebase Firestore!");
  } catch (error) {
    console.warn("⚠️ Falha ao inicializar o Firebase. Ativando Modo Local (LocalStorage)...", error);
    isFirebaseActive = false;
  }
} else {
  console.log("ℹ️ Firebase não configurado ou usando chaves padrão. Ativando Modo Local (LocalStorage) para testes.");
  isFirebaseActive = false;
}

// ==========================================
// MOCK LOCALSTORAGE IMPLEMENTATION (FALLBACK)
// ==========================================

const getLocalScores = () => {
  const data = localStorage.getItem("quiz_ranking");
  return data ? JSON.parse(data) : [];
};

const saveLocalScore = (name, role, userClass, score, timeTaken) => {
  const scores = getLocalScores();
  const newRecord = {
    id: "local_" + Math.random().toString(36).substr(2, 9),
    name,
    role,
    class: role === "aluno" ? userClass : "",
    score: parseInt(score, 10),
    timeTaken: parseFloat(timeTaken),
    createdAt: new Date().toISOString()
  };
  
  scores.push(newRecord);
  // Ordenar por pontos (descendente) e tempo (ascendente)
  scores.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.timeTaken - b.timeTaken;
  });
  
  localStorage.setItem("quiz_ranking", JSON.stringify(scores));
  return newRecord;
};

const getLocalAccessCount = () => {
  const count = localStorage.getItem("quiz_access_count");
  return count ? parseInt(count, 10) : 0;
};

const incrementLocalAccessCount = () => {
  const current = getLocalAccessCount();
  localStorage.setItem("quiz_access_count", current + 1);
  return current + 1;
};

// ==========================================
// EXPORTED SERVICES
// ==========================================

export { isFirebaseActive };

/**
 * Registra a pontuação do jogador
 */
export const saveScore = async (name, role, userClass, score, timeTaken) => {
  if (isFirebaseActive) {
    try {
      const data = {
        name,
        role,
        class: role === "aluno" ? userClass : "",
        score: parseInt(score, 10),
        timeTaken: parseFloat(timeTaken),
        createdAt: new Date()
      };
      const docRef = await addDoc(collection(db, "ranking"), data);
      return { id: docRef.id, ...data };
    } catch (e) {
      console.error("Erro ao salvar no Firebase, tentando salvar localmente: ", e);
      return saveLocalScore(name, role, userClass, score, timeTaken);
    }
  } else {
    return saveLocalScore(name, role, userClass, score, timeTaken);
  }
};

/**
 * Retorna os 500 melhores jogadores ordenados por pontuação desc e tempo asc
 */
export const getTopScores = async () => {
  if (isFirebaseActive) {
    try {
      const q = query(
        collection(db, "ranking"),
        orderBy("score", "desc"),
        orderBy("timeTaken", "asc"),
        limit(500)
      );
      const querySnapshot = await getDocs(q);
      const results = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        results.push({
          id: doc.id,
          ...data,
          // Trata timestamp do Firebase para formato legível no React
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
        });
      });
      return results;
    } catch (e) {
      console.error("Erro ao ler do Firebase, carregando ranking local: ", e);
      return getLocalScores().slice(0, 500);
    }
  } else {
    return getLocalScores().slice(0, 500);
  }
};

/**
 * Incrementa o contador de acessos
 */
export const incrementAccessCount = async () => {
  if (isFirebaseActive) {
    try {
      const docRef = doc(db, "analytics", "global");
      // Verifica se o documento de estatísticas existe primeiro
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        await setDoc(docRef, { accessCount: 1 });
      } else {
        await updateDoc(docRef, {
          accessCount: increment(1)
        });
      }
    } catch (e) {
      console.error("Erro ao incrementar acessos no Firebase: ", e);
      incrementLocalAccessCount();
    }
  } else {
    incrementLocalAccessCount();
  }
};

/**
 * Obtém o total de acessos
 */
export const getAccessCount = async () => {
  if (isFirebaseActive) {
    try {
      const docRef = doc(db, "analytics", "global");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data().accessCount || 0;
      }
      return 0;
    } catch (e) {
      console.error("Erro ao obter acessos do Firebase: ", e);
      return getLocalAccessCount();
    }
  } else {
    return getLocalAccessCount();
  }
};

/**
 * Atualiza os dados de um jogador no ranking (Apenas Admin)
 */
export const updateScoreRecord = async (id, updatedData) => {
  if (isFirebaseActive) {
    try {
      const docRef = doc(db, "ranking", id);
      await updateDoc(docRef, {
        name: updatedData.name,
        class: updatedData.class || "",
        score: parseInt(updatedData.score, 10),
        timeTaken: parseFloat(updatedData.timeTaken)
      });
      return true;
    } catch (e) {
      console.error("Erro ao atualizar no Firebase: ", e);
      // Fallback local
      return updateLocalRecord(id, updatedData);
    }
  } else {
    return updateLocalRecord(id, updatedData);
  }
};

const updateLocalRecord = (id, updatedData) => {
  const scores = getLocalScores();
  const idx = scores.findIndex(s => s.id === id);
  if (idx !== -1) {
    scores[idx] = {
      ...scores[idx],
      name: updatedData.name,
      class: updatedData.class || "",
      score: parseInt(updatedData.score, 10),
      timeTaken: parseFloat(updatedData.timeTaken)
    };
    scores.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.timeTaken - b.timeTaken;
    });
    localStorage.setItem("quiz_ranking", JSON.stringify(scores));
    return true;
  }
  return false;
};

/**
 * Exclui a pontuação de um jogador no ranking (Apenas Admin)
 */
export const deleteScoreRecord = async (id) => {
  if (isFirebaseActive) {
    try {
      const docRef = doc(db, "ranking", id);
      await deleteDoc(docRef);
      return true;
    } catch (e) {
      console.error("Erro ao excluir no Firebase: ", e);
      return deleteLocalRecord(id);
    }
  } else {
    return deleteScoreRecordLocal(id);
  }
};

const deleteScoreRecordLocal = (id) => {
  const scores = getLocalScores();
  const filtered = scores.filter(s => s.id !== id);
  localStorage.setItem("quiz_ranking", JSON.stringify(filtered));
  return true;
};
