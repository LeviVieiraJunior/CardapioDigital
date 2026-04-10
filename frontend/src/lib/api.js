/**
 * ============================================================================
 * LIB: api.js (Axios)
 * ============================================================================
 * O QUE ESSE ARQUIVO FAZ:
 * 1. Centraliza as chamadas de API usando a biblioteca Axios.
 * 2. `baseURL`: Define que o backend está em http://localhost:3000 (ou porta 5000).
 * 3. `interceptors.request`: FUNÇÃO CRITICAL. Antes de qualquer envio ao servidor,
 *    ele verifica na `authStore` se existe um Token. Se sim, ele o coloca no
 *    Header (Authorization: Bearer XXXX), permitindo que o backend saiba
 *    quem é o usuário e autorize a ação.
 * ============================================================================
 */
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

api.interceptors.request.use(
  (config) => {
    // Pegar o token do estado persistido
    const state = useAuthStore.getState();
    const token = state.token;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
