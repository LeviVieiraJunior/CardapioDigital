import { create } from 'zustand';

let toastId = 0;

export const useToastStore = create((set, get) => ({
  toasts: [],

  addToast: (message, type = 'success', duration = 3000) => {
    const id = ++toastId;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, leaving: false }]
    }));

    // Inicia saída após (duration - 400ms) para dar tempo da animação
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.map(t => t.id === id ? { ...t, leaving: true } : t)
      }));
    }, duration - 400);

    // Remove do DOM após a animação de saída
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id)
      }));
    }, duration);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.map(t => t.id === id ? { ...t, leaving: true } : t)
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id)
      }));
    }, 400);
  }
}));
