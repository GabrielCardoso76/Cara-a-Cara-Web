import { auth, database } from './firebase-config.js';

export const SettingsService = {
    async updateUsername(userId, newUsername) {
        try {
            // Atualiza no Authentication
            await auth.currentUser.updateProfile({
                displayName: newUsername
            });
            
            // Atualiza no Realtime Database
            await database.ref(`users/${userId}`).update({
                username: newUsername,
                displayName: newUsername
            });
            
            return true;
        } catch (error) {
            console.error("Erro ao atualizar nome:", error);
            throw error;
        }
    }
};