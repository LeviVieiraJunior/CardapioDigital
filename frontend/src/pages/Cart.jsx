/**
 * ============================================================================
 * COMPONENTE: Cart.jsx
 * ============================================================================
 * PADRÃO DE PROJETO: Carrinho de Compras (Shopping Cart)
 * O QUE ESSE ARQUIVO FAZ:
 * 1. Conecta-se à store global do carrinho (cartStore.js) gerenciada pelo Zustand.
 * 2. `cart` guarda os itens, `removeItem` exclui itens, `updateQuantity` altera a + ou -.
 * 3. O valor total `totalValue` é somado em tempo real com `getCartTotal()`.
 * 4. Valida se a pessoa está logada antes de direcionar para o Checkout.
 *    - Se não logada (isAuthenticated = false), manda pra tela de Login e dps Checkout.
 * ============================================================================
 */
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import './Cart.css';

export default function Cart() {
  const { items, updateQuantity, removeItem, getCartTotal } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const subtotal = getCartTotal();
  const deliveryFee = 5.00; // Fixed delivery fee for mvp
  const total = subtotal + deliveryFee;

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      navigate('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <div className="page-content container cart-empty animate-fade-in">
        <div className="empty-cart-content">
          <ShoppingBag size={80} className="empty-icon" />
          <h2>Seu carrinho está vazio!</h2>
          <p>Adicione algumas delícias e volte aqui para finalizar.</p>
          <Link to="/menu" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Ir para o Cardápio
          </Link>
        </div>
      </div>
    );
  }

  const formatCurrency = (value) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="page-content container cart-page animate-fade-in">
      <h1 className="page-title">Meu Carrinho</h1>
      
      <div className="cart-layout">
        {/* Cart Items List */}
        <div className="cart-items">
          {items.map((item) => (
            <div key={item._id} className="cart-item-card">
              <div className="cart-item-img-wrapper">
                <img 
                  src={item.image || 'https://via.placeholder.com/150'} 
                  alt={item.name} 
                  className="cart-item-img" 
                />
              </div>
              
              <div className="cart-item-details">
                <div className="cart-item-header">
                  <h3 className="cart-item-title">{item.name}</h3>
                  <button 
                    className="btn-remove" 
                    onClick={() => removeItem(item._id)}
                    aria-label="Remover item"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <p className="cart-item-price">{formatCurrency(item.price)}</p>
                
                <div className="cart-item-actions">
                  <div className="quantity-controls">
                    <button 
                      className="btn-qty" 
                      onClick={() => updateQuantity(item._id, item.quantity - 1)}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="qty-value">{item.quantity}</span>
                    <button 
                      className="btn-qty" 
                      onClick={() => updateQuantity(item._id, item.quantity + 1)}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  
                  <div className="item-subtotal">
                    Subtotal: {formatCurrency(item.price * item.quantity)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="cart-summary">
          <h2 className="summary-title">Resumo do Pedido</h2>
          
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          
          <div className="summary-row">
            <span>Taxa de Entrega</span>
            <span>{formatCurrency(deliveryFee)}</span>
          </div>
          
          <div className="summary-divider"></div>
          
          <div className="summary-row total-row">
            <span>Total</span>
            <span className="total-value">{formatCurrency(total)}</span>
          </div>
          
          <button 
            className="btn btn-primary btn-full checkout-btn" 
            onClick={handleCheckout}
          >
            Continuar para Fechar Pedido <ArrowRight size={20} />
          </button>
          
          {!isAuthenticated && (
            <p className="auth-notice mt-2 text-center text-sm text-muted">
              Você será redirecionado para o login se não estiver logado.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
