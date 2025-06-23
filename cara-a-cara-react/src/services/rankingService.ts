import { collection, query, orderBy, limit, getDocs, DocumentData } from 'firebase/firestore';
import { firestore } from './firebase';

export interface RankingUser {
  id: string;
  username: string; // displayName do perfil do usuário
  wins: number;
  losses: number;
  matches: number;
  winRate: number;
}

export const fetchRankingData = async (fetchLimit: number = 50): Promise<RankingUser[]> => {
  try {
    // Acessa a coleção 'users', depois o subdocumento 'stats/gameStats' para ordenação.
    // Para fazer isso diretamente, precisaríamos de uma coleção desnormalizada de 'userStats'
    // ou garantir que 'users' tenha os campos de stats no nível raiz para ordenação.
    // Assumindo que 'users/{uid}/stats/gameStats' existe e tem 'wins'.
    // Firestore não suporta ordenação direta em campos de subcoleções em uma query na coleção pai.
    // Abordagem 1: Buscar todos os usuários e suas subcoleções de stats (ineficiente para muitos usuários).
    // Abordagem 2: Manter os stats principais (wins, matches) desnormalizados no documento principal do usuário.
    // Abordagem 3: Criar uma coleção separada 'userGameStats' com uid para join manual ou referência.

    // Vamos pela Abordagem 2 (desnormalização) como sendo a mais prática para ranking.
    // Agora que os dados estão desnormalizados no documento principal 'users/{uid}',
    // podemos fazer uma query direta e eficiente.
    const usersCollectionRef = collection(firestore, 'users');
    const q = query(
      usersCollectionRef,
      orderBy('wins', 'desc'),      // Ordena por vitórias (decrescente)
      orderBy('winRate', 'desc'), // Depois por taxa de vitórias (decrescente)
      orderBy('matches', 'desc'), // Depois por número de partidas (decrescente, mais experiente)
      limit(fetchLimit)
    );

    const querySnapshot = await getDocs(q);
    const users: RankingUser[] = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      // O winRate já deve estar calculado e armazenado no documento do usuário
      // Se não estiver, precisaria ser calculado aqui ou garantir que seja no write.
      // A função updateUserStats agora calcula e armazena winRate.
      return {
        id: docSnap.id,
        username: data.displayName || data.email?.split('@')[0] || `Usuário ${docSnap.id.substring(0,4)}`,
        wins: data.wins || 0,
        losses: data.losses || 0,
        matches: data.matches || 0,
        winRate: data.winRate || 0,
      } as RankingUser;
    });
    return users;

  } catch (error) {
    console.error("Erro ao buscar ranking do Firestore (desnormalizado):", error);
    throw error; // Re-throw para ser tratado pelo chamador
  }
};

// TODO: Considerar desnormalizar os dados de 'wins', 'matches' e 'displayName' para o documento 'users/{uid}'
// para permitir ordenação e filtragem direta e eficiente pelo Firestore.
// Exemplo de query se desnormalizado:
/*
export const fetchRankingDataDenormalized = async (fetchLimit: number = 50): Promise<RankingUser[]> => {
  try {
    const usersCollectionRef = collection(firestore, 'users');
    const q = query(
      usersCollectionRef,
      orderBy('wins', 'desc'), // Assumindo que 'wins' está no documento principal do usuário
      orderBy('winRate', 'desc'), // Critério de desempate
      limit(fetchLimit)
    );

    const querySnapshot = await getDocs(q);
    const users: RankingUser[] = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        username: data.displayName || data.email?.split('@')[0] || `Usuário ${docSnap.id.substring(0,4)}`,
        wins: data.wins || 0,
        losses: data.losses || 0,
        matches: data.matches || 0,
        winRate: data.winRate || 0, // winRate também precisaria ser desnormalizado/calculado no write
      } as RankingUser;
    });
    return users;
  } catch (error) {
    console.error("Erro ao buscar ranking (desnormalizado) do Firestore:", error);
    throw error;
  }
};
*/
