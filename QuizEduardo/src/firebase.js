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
  where,
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
// TIMEOUT HELPER (guard against ad-blocker blocks)
// ==========================================

/**
 * Races a Firebase promise against a timeout.
 * If Firebase doesn't resolve within `ms` milliseconds (e.g. blocked by an
 * ad-blocker), the returned promise rejects so callers can fall back to
 * LocalStorage immediately instead of hanging the UI.
 */
const withTimeout = (promise, ms = 4000) => {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Firebase timeout after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
};

// ==========================================
// MOCK LOCALSTORAGE IMPLEMENTATION (FALLBACK)
// ==========================================

const getLocalScores = () => {
  const data = localStorage.getItem("quiz_ranking");
  return data ? JSON.parse(data) : [];
};

const saveLocalScore = (name, role, userClass, score, timeTaken) => {
  const scores = getLocalScores();
  const resolvedClass = role === "aluno" ? userClass : "";
  const newScore = parseInt(score, 10);
  const newTime  = parseFloat(timeTaken);

  // Upsert: procura registro existente com mesmo nome + turma + função
  const existingIdx = scores.findIndex(
    s => s.name?.toLowerCase() === name?.toLowerCase() &&
         s.role === role &&
         (role !== 'aluno' || s.class?.toLowerCase() === resolvedClass?.toLowerCase())
  );

  if (existingIdx !== -1) {
    const existing = scores[existingIdx];
    // Atualiza apenas se a nova pontuação for melhor (mais pontos, ou mesmo pontos em menos tempo)
    const isBetter = newScore > existing.score ||
                     (newScore === existing.score && newTime < existing.timeTaken);
    if (isBetter) {
      scores[existingIdx] = { ...existing, score: newScore, timeTaken: newTime };
    }
    scores.sort((a, b) => b.score !== a.score ? b.score - a.score : a.timeTaken - b.timeTaken);
    localStorage.setItem("quiz_ranking", JSON.stringify(scores));
    return scores[existingIdx !== -1 ? scores.findIndex(s => s.id === existing.id) : 0];
  }

  // Novo registro
  const newRecord = {
    id: "local_" + Math.random().toString(36).substr(2, 9),
    name,
    role,
    class: resolvedClass,
    score: newScore,
    timeTaken: newTime,
    createdAt: new Date().toISOString()
  };
  scores.push(newRecord);
  scores.sort((a, b) => b.score !== a.score ? b.score - a.score : a.timeTaken - b.timeTaken);
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
 * Registra (ou atualiza) a pontuação do jogador.
 * Upsert: se já existir um registro com mesmo nome + turma + função,
 * atualiza somente se o novo resultado for melhor. Caso contrário, mantém o antigo.
 */
export const saveScore = async (name, role, userClass, score, timeTaken) => {
  const resolvedClass = role === "aluno" ? userClass : "";
  const newScore = parseInt(score, 10);
  const newTime  = parseFloat(timeTaken);

  if (isFirebaseActive) {
    try {
      // Busca registro existente com mesmo nome + turma + função
      const q = query(
        collection(db, "ranking"),
        where("name", "==", name),
        where("role", "==", role),
        where("class", "==", resolvedClass)
      );
      const existing = await withTimeout(getDocs(q));

      if (!existing.empty) {
        // Já existe: verifica se o novo resultado é melhor
        const existingDoc = existing.docs[0];
        const existingData = existingDoc.data();
        const isBetter = newScore > existingData.score ||
                         (newScore === existingData.score && newTime < existingData.timeTaken);

        if (isBetter) {
          await withTimeout(updateDoc(doc(db, "ranking", existingDoc.id), {
            score: newScore,
            timeTaken: newTime,
            updatedAt: new Date()
          }));
        }
        // Retorna o documento existente (atualizado ou não)
        return { id: existingDoc.id, ...existingData, score: isBetter ? newScore : existingData.score, timeTaken: isBetter ? newTime : existingData.timeTaken };
      }

      // Nenhum registro existente: cria novo
      const data = {
        name,
        role,
        class: resolvedClass,
        score: newScore,
        timeTaken: newTime,
        createdAt: new Date()
      };
      const docRef = await withTimeout(addDoc(collection(db, "ranking"), data));
      return { id: docRef.id, ...data };
    } catch (e) {
      console.warn("Erro ao salvar no Firebase, salvando localmente: ", e.message);
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
      const querySnapshot = await withTimeout(getDocs(q));
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
      console.warn("Erro ao ler do Firebase, carregando ranking local: ", e.message);
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
      const docSnap = await withTimeout(getDoc(docRef));
      if (!docSnap.exists()) {
        await withTimeout(setDoc(docRef, { accessCount: 1 }));
      } else {
        await withTimeout(updateDoc(docRef, {
          accessCount: increment(1)
        }));
      }
    } catch (e) {
      console.warn("Erro ao incrementar acessos no Firebase: ", e.message);
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
      const docSnap = await withTimeout(getDoc(docRef));
      if (docSnap.exists()) {
        return docSnap.data().accessCount || 0;
      }
      return 0;
    } catch (e) {
      console.warn("Erro ao obter acessos do Firebase: ", e.message);
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
      await withTimeout(updateDoc(docRef, {
        name: updatedData.name,
        class: updatedData.class || "",
        score: parseInt(updatedData.score, 10),
        timeTaken: parseFloat(updatedData.timeTaken)
      }));
      return true;
    } catch (e) {
      console.warn("Erro ao atualizar no Firebase: ", e.message);
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
      await withTimeout(deleteDoc(docRef));
      return true;
    } catch (e) {
      console.warn("Erro ao excluir no Firebase: ", e.message);
      return deleteScoreRecordLocal(id);
    }
  } else {
    return deleteScoreRecordLocal(id);
  }
};

/**
 * Apaga TODOS os registros do ranking (Apenas Admin)
 */
export const clearAllScores = async () => {
  if (isFirebaseActive) {
    try {
      const querySnapshot = await withTimeout(getDocs(collection(db, "ranking")));
      const deletions = querySnapshot.docs.map(d => withTimeout(deleteDoc(doc(db, "ranking", d.id))));
      await Promise.all(deletions);
      return true;
    } catch (e) {
      console.warn("Erro ao limpar ranking no Firebase: ", e.message);
      localStorage.setItem("quiz_ranking", JSON.stringify([]));
      return true;
    }
  } else {
    localStorage.setItem("quiz_ranking", JSON.stringify([]));
    return true;
  }
};

const deleteScoreRecordLocal = (id) => {
  const scores = getLocalScores();
  const filtered = scores.filter(s => s.id !== id);
  localStorage.setItem("quiz_ranking", JSON.stringify(filtered));
  return true;
};
