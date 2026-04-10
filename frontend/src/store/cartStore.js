/**
 * ============================================================================
 * STORE: cartStore.js (Zustand)
 * ============================================================================
 * O QUE ESSE ARQUIVO FAZ:
 * 1. Gerencia o estado global do carrinho de compras.
 * 2. `addItem`: Adiciona um produto ou aumenta a quantidade se já existir.
 * 3. `removeItem`: Remove um produto completamente pelo ID.
 * 4. `updateQuantity`: Ajusta a quantidade manualmente.
 * 5. `persist`: Salva o carrinho automaticamente no LocalStorage ('cart-storage'),
 *    para que os itens não sumam ao atualizar a página (F5).
 * ============================================================================
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product) => {
        set((state) => {
          const existingItem = state.items.find(item => item._id === product._id);
          if (existingItem) {
            return {
              items: state.items.map(item => 
                item._id === product._id 
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              )
            };
          }
          return { items: [...state.items, { ...product, quantity: 1 }] };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter(item => item._id !== productId)
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity < 1) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map(item =>
            item._id === productId ? { ...item, quantity } : item
          )
        }));
      },

      clearCart: () => set({ items: [] }),

      getCartTotal: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },

      getCartCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      }
    }),
    {
      name: 'cart-storage',
    }
  )
);
