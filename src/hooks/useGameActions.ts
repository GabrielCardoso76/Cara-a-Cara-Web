import { ref, push, serverTimestamp, set } from 'firebase/database';
import { database, auth } from '../services/firebase'; // ATENÇÃO: Caminho pode precisar de ajuste
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext'; // ATENÇÃO: Caminho pode precisar de ajuste
import { User } from 'firebase/auth'; // Importando User para tipagem

// Definição da interface RoomDetails, se necessário, ou usar inline
interface CreateRoomDetails {
  name: string;
  isPrivate: boolean;
  password?: string;
}

const useGameActions = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  const createRoom = async (roomDetails: CreateRoomDetails) => {
    const currentUser = auth.currentUser as User; // Type assertion para User

    if (!currentUser) {
      addNotification('Você precisa estar logado para criar uma sala.', 'error');
      console.error('Usuário não logado tentou criar uma sala.');
      return;
    }

    const roomsListRef = ref(database, 'rooms');
    const newRoomRef = push(roomsListRef); // Gera uma ID única para a nova sala

    if (!newRoomRef.key) {
      addNotification('Não foi possível obter uma chave para a nova sala.', 'error');
      console.error('Falha ao obter a key para a nova sala.');
      return;
    }

    const roomData: any = { // Usamos 'any' para construir o objeto dinamicamente
      id: newRoomRef.key,
      name: roomDetails.name,
      ownerId: currentUser.uid,
      ownerName: currentUser.displayName || 'Anônimo',
      players: { [currentUser.uid]: true },
      playerCount: 1,
      isPrivate: roomDetails.isPrivate,
      createdAt: serverTimestamp(),
      gameState: 'waiting',
    };

    // <<< LÓGICA CORRIGIDA PARA EVITAR 'UNDEFINED'
    if (roomDetails.isPrivate) {
      if (roomDetails.password && roomDetails.password.trim() !== '') {
        roomData.password = roomDetails.password;
      } else {
        addNotification('Salas privadas requerem uma senha.', 'error');
        console.error('Tentativa de criar sala privada sem senha.');
        return; // Impede a criação da sala se for privada e sem senha
      }
    }

    try {
      await set(newRoomRef, roomData);
      addNotification(`Sala "${roomDetails.name}" criada com sucesso!`, "success");
      navigate(`/game/${newRoomRef.key}`);
    } catch (error: any) {
      console.error("Erro ao criar sala:", error);
      addNotification(`Falha ao criar sala: ${error.message}`, "error");
    }
  };

  // Outras ações do jogo (entrar na sala, etc.) podem ser adicionadas aqui
  return { createRoom };
};

export default useGameActions;
