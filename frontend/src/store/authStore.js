/**
 * ============================================================================
 * STORE: authStore.js (Zustand)
 * ============================================================================
 * O QUE ESSE ARQUIVO FAZ:
 * 1. Gerencia o estado de autenticação do usuário.
 * 2. Guarda o objeto `user` (id, email) e o `token` JWT recebido do servidor.
 * 3. `isAuthenticated`: Booleano para esconder/mostrar rotas protegidas.
 * 4. `persist`: Salva os dados de login no LocalStorage ('auth-storage').
 * ============================================================================
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (userData, token) => set({ user: userData, token, isAuthenticated: true }),
      logout: async () => {
        const token = get().token;
        if (token) {
          try {
            await api.post('/auth/logout', {}, {
              headers: { Authorization: `Bearer ${token}` }
            });
          } catch(e) {
            console.error('Erro ao fechar sessão remota', e);
          }
        }
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
