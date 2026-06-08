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
  increment,
  onSnapshot
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
 * Retorna os 500 melhores jogadores ordenados por pontuação desc e tempo asc.
 * Tenta primeiro a query composta (requer índice no Firestore). Se falhar por
 * ausência de índice, busca sem ordenação e ordena no cliente.
 */
export const getTopScores = async () => {
  if (isFirebaseActive) {
    // Tentativa 1: query com índice composto (score desc + timeTaken asc)
    try {
      const q = query(
        collection(db, "ranking"),
        orderBy("score", "desc"),
        orderBy("timeTaken", "asc"),
        limit(500)
      );
      const querySnapshot = await withTimeout(getDocs(q));
      const results = [];
      querySnapshot.forEach((d) => {
        const data = d.data();
        results.push({
          id: d.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
        });
      });
      console.log(`✅ Ranking carregado do Firebase: ${results.length} registros`);
      return results;
    } catch (e) {
      // Tentativa 2: busca sem índice composto, ordena no cliente
      // Isso acontece quando o índice composto não foi criado no Firestore.
      console.warn("⚠️ Índice composto não encontrado ou erro na query. Tentando busca simples...", e.message);
      try {
        const q2 = query(
          collection(db, "ranking"),
          orderBy("score", "desc"),
          limit(500)
        );
        const snapshot2 = await withTimeout(getDocs(q2));
        const results2 = [];
        snapshot2.forEach((d) => {
          const data = d.data();
          results2.push({
            id: d.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
          });
        });
        // Ordena por pontuação desc, depois tempo asc (client-side)
        results2.sort((a, b) => b.score !== a.score ? b.score - a.score : (a.timeTaken ?? Infinity) - (b.timeTaken ?? Infinity));
        console.log(`✅ Ranking carregado (ordenação local): ${results2.length} registros`);
        return results2;
      } catch (e2) {
        // Tentativa 3: busca sem nenhuma ordenação
        console.warn("⚠️ Falha na query simples. Tentando busca sem orderBy...", e2.message);
        try {
          const snapshot3 = await withTimeout(getDocs(collection(db, "ranking")));
          const results3 = [];
          snapshot3.forEach((d) => {
            const data = d.data();
            results3.push({
              id: d.id,
              ...data,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
            });
          });
          results3.sort((a, b) => b.score !== a.score ? b.score - a.score : (a.timeTaken ?? Infinity) - (b.timeTaken ?? Infinity));
          console.log(`✅ Ranking carregado (sem índice): ${results3.length} registros`);
          return results3;
        } catch (e3) {
          console.error("❌ Erro ao ler ranking do Firebase:", e3.message);
          return getLocalScores().slice(0, 500);
        }
      }
    }
  } else {
    return getLocalScores().slice(0, 500);
  }
};

/**
 * Escuta em tempo real os 500 melhores jogadores.
 * Retorna a função de unsubscribe — chame-a no cleanup do useEffect.
 *
 * @param {function} callback - Chamada com o array atualizado de scores sempre que houver mudança.
 * @returns {function} unsubscribe
 */
export const subscribeToTopScores = (callback) => {
  if (!isFirebaseActive) {
    // Modo offline: retorna os dados locais uma única vez e simula o padrão de subscribe
    callback(getLocalScores().slice(0, 500));
    return () => {}; // no-op unsubscribe
  }

  // Tenta a query com índice composto (score desc + timeTaken asc)
  const buildResults = (snapshot) => {
    const results = [];
    snapshot.forEach((d) => {
      const data = d.data();
      results.push({
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
      });
    });
    return results;
  };

  try {
    const q = query(
      collection(db, "ranking"),
      orderBy("score", "desc"),
      orderBy("timeTaken", "asc"),
      limit(500)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const results = buildResults(snapshot);
        console.log(`🔴 Ranking atualizado em tempo real: ${results.length} registros`);
        callback(results);
      },
      (error) => {
        // Índice composto ausente — tenta query mais simples com onSnapshot
        console.warn("⚠️ onSnapshot com índice composto falhou. Tentando sem timeTaken...", error.message);

        try {
          const q2 = query(
            collection(db, "ranking"),
            orderBy("score", "desc"),
            limit(500)
          );
          return onSnapshot(
            q2,
            (snapshot2) => {
              const results2 = buildResults(snapshot2);
              results2.sort((a, b) =>
                b.score !== a.score ? b.score - a.score : (a.timeTaken ?? Infinity) - (b.timeTaken ?? Infinity)
              );
              callback(results2);
            },
            (err2) => {
              console.error("❌ onSnapshot falhou totalmente:", err2.message);
              callback(getLocalScores().slice(0, 500));
            }
          );
        } catch (e) {
          callback(getLocalScores().slice(0, 500));
          return () => {};
        }
      }
    );

    return unsubscribe;
  } catch (e) {
    console.error("❌ Erro ao criar listener do ranking:", e.message);
    callback(getLocalScores().slice(0, 500));
    return () => {};
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
