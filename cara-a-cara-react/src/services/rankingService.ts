import { ref, query, orderByChild, limitToLast, get } from 'firebase/database';
import { database } from './firebase'; // Alterado para database

export interface RankingUser {
  id: string;
  username: string;
  wins: number;
  losses: number;
  matches: number;
  winRate: number;
}

// Assume que os dados dos usuários para ranking estão em '/users/{userId}'
// e que cada usuário tem 'wins', 'winRate', 'matches', 'displayName'.
// Para o Realtime Database, é crucial ter regras de segurança que permitam
// a leitura e indexação desses campos.
// Ex: ".indexOn": ["wins", "winRate", "matches"] no nó 'users'.
export const fetchRankingData = async (fetchLimit: number = 50): Promise<RankingUser[]> => {
  try {
    const usersRef = ref(database, 'users');

    // Realtime Database não suporta ordenação por múltiplos campos diretamente como o Firestore.
    // A estratégia comum é ordenar pelo campo primário (ex: 'wins') e fazer o resto
    // da ordenação/lógica no cliente, ou criar índices compostos se a lógica for complexa
    // e sempre a mesma (o que não é o caso aqui com múltiplos orderBys).
    // Para este caso, vamos ordenar primariamente por 'wins'.
    // A ordenação secundária por 'winRate' e 'matches' terá que ser feita no cliente
    // após buscar os dados, ou ter um campo composto (ex: wins_winRate) se for crítico.
    // Por simplicidade, vamos buscar ordenado por 'wins' e depois ordenar no cliente.

    // Nota: limitToLast busca os últimos N itens. Se 'wins' são números maiores para melhor ranking,
    // e o RTDB ordena em ascendente por padrão, precisamos buscar os "últimos" (maiores)
    // ou buscar todos e ordenar, ou inverter a ordem dos valores (e.g. armazenar -wins).
    // A forma mais simples é buscar por 'wins' e então reverter/ordenar no cliente.
    // Ou, se os dados não forem excessivos, buscar todos e ordenar.
    // Por agora, vamos usar orderByChild('wins').limitToLast(fetchLimit) e depois ordenar.

    const q = query(
      usersRef,
      orderByChild('wins'), // Ordena por vitórias (ascendente por padrão)
      limitToLast(fetchLimit) // Pega os N maiores (já que é ascendente)
    );

    const snapshot = await get(q);
    const users: RankingUser[] = [];
    if (snapshot.exists()) {
      snapshot.forEach(childSnapshot => {
        const data = childSnapshot.val();
        // O displayName pode estar no perfil do usuário ou precisar ser buscado separadamente se não desnormalizado.
        // Assumindo que está em 'users/{uid}/displayName' ou 'users/{uid}/email'
        // E stats como 'wins', 'losses', 'matches', 'winRate' estão em 'users/{uid}/stats' ou diretamente.
        // Para simplificar, vamos assumir que estão no mesmo nível ou em `data.stats`.
        const stats = data.stats || data; // Se 'stats' for um subnó

        users.push({
          id: childSnapshot.key!,
          username: data.displayName || data.email?.split('@')[0] || `Usuário ${childSnapshot.key!.substring(0,4)}`,
          wins: stats.wins || 0,
          losses: stats.losses || 0,
          matches: stats.matches || 0,
          winRate: stats.winRate || 0,
        });
      });
    }

    // Como limitToLast com orderByChild('wins') retorna em ordem ascendente de vitórias,
    // precisamos reverter para ter os maiores primeiro.
    // E depois aplicar a ordenação secundária.
    return users.sort((a, b) => {
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }
      if (b.winRate !== a.winRate) {
        return b.winRate - a.winRate;
      }
      return b.matches - a.matches;
    });

  } catch (error) {
    console.error("Erro ao buscar ranking do Realtime Database:", error);
    throw error; // Re-throw para ser tratado pelo chamador
  }
};
