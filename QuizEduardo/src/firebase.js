import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, update, remove, onValue } from 'firebase/database';


const firebaseConfig = {
  apiKey: "AIzaSyCOdhN6btYs6TC3H6ceqiqzde0Ma4FVung",
  authDomain: "quizeduardo-a7c1e.firebaseapp.com",
  databaseURL: "https://quizeduardo-a7c1e-default-rtdb.firebaseio.com",
  projectId: "quizeduardo-a7c1e",
  storageBucket: "quizeduardo-a7c1e.firebasestorage.app",
  messagingSenderId: "247579301520",
  appId: "1:247579301520:web:11ca7e788f9e4d0e046a15",
  measurementId: "G-RZTBJJT9MB"
};

let app;
let db;
let isFirebaseActive = false;

try {
  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
  isFirebaseActive = true;
  console.log("🔥 Conectado com sucesso ao Firebase Realtime Database!");
} catch (e) {
  console.warn('⚠️ Firebase não configurado. Usando localStorage como fallback.', e.message);
  isFirebaseActive = false;
}

export { isFirebaseActive };

// =====================================================
// UTILITÁRIOS
// =====================================================

/**
 * Gera um ID único por jogador (nome + turma normalizados)
 */
const getPlayerId = (name, role, userClass) => {
  const className = role === "aluno" ? userClass : "";
  return (name.trim().toLowerCase() + '_' + className.trim().toLowerCase())
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
};

// =====================================================
// FIREBASE OPERATIONS
// =====================================================

/**
 * Salva ou atualiza um score no ranking global
 * Só atualiza se o novo score for melhor
 */
export const saveScore = async (name, role, userClass, score, timeTaken) => {
  const resolvedClass = role === "aluno" ? userClass : "";
  const newScore = parseInt(score, 10);
  const newTime = parseFloat(timeTaken);

  if (!isFirebaseActive) {
    return saveScoreLocal(name, role, userClass, newScore, newTime);
  }

  try {
    const playerId = getPlayerId(name, role, userClass);
    const entryRef = ref(db, `rankings/quiz/${playerId}`);

    const snapshot = await get(entryRef);
    if (snapshot.exists()) {
      const existing = snapshot.val();
      // Só atualiza se o novo score for MELHOR
      const isBetter =
        newScore > existing.score ||
        (newScore === existing.score && newTime < (existing.timeTaken || 9999));
      if (!isBetter) return existing;
    }

    const playerData = {
      name,
      role,
      class: resolvedClass,
      score: newScore,
      timeTaken: newTime,
      playerId,
      date: new Date().toISOString()
    };

    await set(entryRef, playerData);
    return playerData;
  } catch (error) {
    console.error('Erro ao salvar no Firebase:', error.message);
    return saveScoreLocal(name, role, userClass, newScore, newTime);
  }
};

/**
 * Ouve mudanças no ranking em tempo real
 * Garante a MESMA ordem em todos os dispositivos
 */
export const subscribeToTopScores = (callback) => {
  if (!isFirebaseActive) {
    callback(getRankingLocal().slice(0, 500));
    return () => {};
  }

  const rankingRef = ref(db, 'rankings/quiz');
  
  const unsubscribe = onValue(rankingRef, (snapshot) => {
    try {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([key, val]) => ({ ...val, _key: key }));

      // ┌─────────────────────────────────────────────────────────────────────┐
      // │ ORDENAÇÃO CRÍTICA: Mesma ordem em todos os dispositivos             │
      // │ 1. Score DESC (maior pontuação primeiro)                            │
      // │ 2. Tempo ASC (menor tempo em caso de empate)                        │
      // │ 3. Data DESC (mais recente em caso de outro empate)                 │
      // └─────────────────────────────────────────────────────────────────────┘
      list.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        if ((a.timeTaken || 9999) !== (b.timeTaken || 9999)) {
          return (a.timeTaken || 9999) - (b.timeTaken || 9999);
        }
        return new Date(b.date) - new Date(a.date);
      });

      console.log(`✅ Ranking em tempo real: ${list.length} registros`);
      callback(list.slice(0, 500));
    } catch (error) {
      console.error('Erro ao processar ranking:', error.message);
      callback(getRankingLocal().slice(0, 500));
    }
  });

  return unsubscribe;
};

/**
 * Busca o ranking uma única vez (para admin)
 */
export const getTopScores = async () => {
  if (!isFirebaseActive) {
    return getRankingLocal();
  }

  try {
    const rankingRef = ref(db, 'rankings/quiz');
    const snapshot = await get(rankingRef);
    const data = snapshot.val() || {};
    const list = Object.entries(data).map(([key, val]) => ({ ...val, _key: key }));

    // Mesma ordenação SEMPRE
    list.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if ((a.timeTaken || 9999) !== (b.timeTaken || 9999)) {
        return (a.timeTaken || 9999) - (b.timeTaken || 9999);
      }
      return new Date(b.date) - new Date(a.date);
    });

    console.log(`✅ Ranking carregado: ${list.length} registros`);
    return list.slice(0, 500);
  } catch (error) {
    console.error('Erro ao buscar ranking:', error.message);
    return getRankingLocal();
  }
};

/**
 * Deleta uma entrada do ranking (admin)
 */
export const deleteScoreRecord = async (playerId) => {
  if (!isFirebaseActive) {
    return deleteEntryLocal(playerId);
  }

  try {
    const entryRef = ref(db, `rankings/quiz/${playerId}`);
    await remove(entryRef);
    return true;
  } catch (error) {
    console.error('Erro ao deletar:', error.message);
    return deleteEntryLocal(playerId);
  }
};

/**
 * Atualiza uma entrada do ranking (admin)
 */
export const updateScoreRecord = async (playerId, data) => {
  if (!isFirebaseActive) {
    return updateEntryLocal(playerId, data);
  }

  try {
    const entryRef = ref(db, `rankings/quiz/${playerId}`);
    await update(entryRef, {
      name: data.name,
      class: data.class,
      score: parseInt(data.score, 10),
      timeTaken: parseFloat(data.timeTaken)
    });
    return true;
  } catch (error) {
    console.error('Erro ao atualizar:', error.message);
    return updateEntryLocal(playerId, data);
  }
};

/**
 * Limpa todo o ranking (admin)
 */
export const clearRanking = async () => {
  if (!isFirebaseActive) {
    localStorage.removeItem('quiz_ranking');
    return;
  }

  try {
    const rankingRef = ref(db, 'rankings/quiz');
    await remove(rankingRef);
  } catch (error) {
    console.error('Erro ao limpar ranking:', error.message);
  }
};

/**
 * Incrementa o contador de acessos
 */
export const incrementAccessCount = async () => {
  if (!isFirebaseActive) {
    incrementLocalAccessCount();
    return;
  }

  try {
    const countRef = ref(db, 'analytics/accessCount');
    const snapshot = await get(countRef);
    const current = snapshot.val() || 0;
    await set(countRef, current + 1);
  } catch (error) {
    console.warn('Erro ao incrementar acessos:', error.message);
    incrementLocalAccessCount();
  }
};

/**
 * Obtém o total de acessos
 */
export const getAccessCount = async () => {
  if (!isFirebaseActive) {
    return getLocalAccessCount();
  }

  try {
    const countRef = ref(db, 'analytics/accessCount');
    const snapshot = await get(countRef);
    return snapshot.val() || 0;
  } catch (error) {
    console.warn('Erro ao obter acessos:', error.message);
    return getLocalAccessCount();
  }
};

// =====================================================
// FALLBACK: LocalStorage
// =====================================================

const saveScoreLocal = (name, role, userClass, score, timeTaken) => {
  const saved = JSON.parse(localStorage.getItem('quiz_ranking') || '{}');
  const playerId = getPlayerId(name, role, userClass);
  const existing = saved[playerId];

  if (!existing ||
    score > existing.score ||
    (score === existing.score && timeTaken < (existing.timeTaken || 9999))) {
    saved[playerId] = {
      name,
      role,
      class: role === "aluno" ? userClass : "",
      score,
      timeTaken,
      playerId,
      date: new Date().toISOString()
    };
    localStorage.setItem('quiz_ranking', JSON.stringify(saved));
  }

  return saved[playerId];
};

const getRankingLocal = () => {
  const saved = JSON.parse(localStorage.getItem('quiz_ranking') || '{}');
  const list = Object.values(saved);

  list.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if ((a.timeTaken || 9999) !== (b.timeTaken || 9999)) {
      return (a.timeTaken || 9999) - (b.timeTaken || 9999);
    }
    return new Date(b.date) - new Date(a.date);
  });

  return list.slice(0, 500);
};

const deleteEntryLocal = (playerId) => {
  const saved = JSON.parse(localStorage.getItem('quiz_ranking') || '{}');
  delete saved[playerId];
  localStorage.setItem('quiz_ranking', JSON.stringify(saved));
};

const updateEntryLocal = (playerId, data) => {
  const saved = JSON.parse(localStorage.getItem('quiz_ranking') || '{}');
  if (saved[playerId]) {
    saved[playerId] = {
      ...saved[playerId],
      name: data.name,
      class: data.class,
      score: parseInt(data.score, 10),
      timeTaken: parseFloat(data.timeTaken)
    };
    localStorage.setItem('quiz_ranking', JSON.stringify(saved));
  }
};

const getLocalAccessCount = () => {
  const count = localStorage.getItem('quiz_access_count');
  return count ? parseInt(count, 10) : 0;
};

const incrementLocalAccessCount = () => {
  const current = getLocalAccessCount();
  localStorage.setItem('quiz_access_count', current + 1);
};
