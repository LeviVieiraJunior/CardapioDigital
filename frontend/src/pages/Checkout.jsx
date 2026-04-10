/**
 * ============================================================================
 * COMPONENTE: Checkout.jsx
 * ============================================================================
 * PADRÃO DE PROJETO: Finalização de Compra (Checkout Flow)
 * O QUE ESSE ARQUIVO FAZ:
 * 1. Coleta dados de entrega (Nome, Telefone, Endereço, Complemento).
 * 2. Gerencia a lógica de Pagamento:
 *    - Se for 'Dinheiro', exibe opção de 'Troco'.
 *    - Se for 'Pix' ou 'Cartão', o pedido é criado com status de pagamento pendente.
 * 3. `handleSubmit`: Consolida os itens do carrinho + taxas e envia para POST /orders.
 * 4. Após o sucesso, limpa o carrinho e redireciona o usuário para o Histórico (Profile).
 * ============================================================================
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useToastStore } from '../store/toastStore';
import api from '../lib/api';
import './Checkout.css';

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, getCartTotal, clearCart } = useCartStore();
  const { addToast } = useToastStore();

  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    phone: '',
    address: user?.address || '',
    complement: '',
    paymentMethod: 'Pix',
    deliveryType: 'city',
    requiresChange: false,
    changeFor: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isStoreClosed, setIsStoreClosed] = useState(false);

  // Taxas dinâmicas do Admin
  const [fees, setFees] = useState({ cityDeliveryFee: 5, ruralDeliveryFee: 10 });

  useEffect(() => {
    const fetchFees = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data.body) {
          setFees({
            cityDeliveryFee: Number(res.data.body.cityDeliveryFee) || 0,
            ruralDeliveryFee: Number(res.data.body.ruralDeliveryFee) || 0
          });
        }
      } catch (e) { console.error('Erro ao buscar taxas', e); }
    };

    const checkStoreStatus = async () => {
      try {
        const res = await api.get('/cash-registers/active');
        setIsStoreClosed(!res.data.body); // se não há caixa ativo, loja está fechada
      } catch { setIsStoreClosed(false); } // em caso de erro, não bloqueia
    };

    fetchFees();
    checkStoreStatus();
  }, []);

  const subtotal = getCartTotal();
  const deliveryFee = formData.deliveryType === 'pickup' ? 0
    : formData.deliveryType === 'rural' ? fees.ruralDeliveryFee
    : fees.cityDeliveryFee;
  const total = subtotal + deliveryFee;

  // Redirect if empty cart
  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const orderPayload = {
        userId: user.id || user._id,
        items: items.map(item => ({
          plateId: item._id,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: total,
        total: total, // campo usado pelo módulo de fluxo de caixa
        deliveryFee,
        deliveryType: formData.deliveryType,
        deliveryAddress: formData.deliveryType === 'pickup' ? 'Retirada no local' : `${formData.address} - ${formData.complement}`,
        customerName: formData.fullName,
        customerPhone: formData.phone,
        paymentMethod: formData.paymentMethod,
        requiresChange: formData.requiresChange,
        changeFor: formData.requiresChange ? Number(formData.changeFor) : 0,
        status: 'Recebido'
      };

      await api.post('/orders', orderPayload);

      clearCart();
      addToast('Pedido realizado com sucesso! 🎉', 'success', 4000);
      navigate('/orders');
    } catch (err) {
      setError('Erro ao finalizar o pedido. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content container checkout-page animate-fade-in">
      <h1 className="page-title">Finalizar Pedido</h1>

      {error && <div className="error-banner">{error}</div>}

      {/* Banner de Loja Fechada */}
      {isStoreClosed && (
        <div style={{
          background: '#FEF2F2', border: '1.5px solid #FCA5A5', borderRadius: '12px',
          padding: '1rem 1.5rem', marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', gap: '0.8rem'
        }}>
          <span style={{ fontSize: '1.5rem' }}>🔒</span>
          <div>
            <strong style={{ color: '#DC2626', display: 'block' }}>Estabelecimento Fechado</strong>
            <span style={{ color: '#B91C1C', fontSize: '0.9rem' }}>Não estamos aceitando pedidos no momento. Volte mais tarde!</span>
          </div>
        </div>
      )}

      <div className="checkout-layout">
        <form onSubmit={handleSubmit} className="checkout-form-container">

          {/* Tipo de Entrega */}
          <section className="form-section">
            <h2 className="section-title">Tipo de Entrega</h2>
            <div className="payment-options" style={{ marginBottom: '1rem' }}>
              {[
                { value: 'city', label: '🏙️ Cidade', sublabel: `R$ ${fees.cityDeliveryFee.toFixed(2)}` },
                { value: 'rural', label: '🌾 Zona Rural', sublabel: `R$ ${fees.ruralDeliveryFee.toFixed(2)}` },
                { value: 'pickup', label: '🏪 Buscar no Local', sublabel: 'Grátis' },
              ].map(opt => (
                <label
                  key={opt.value}
                  className={`payment-card ${formData.deliveryType === opt.value ? 'active' : ''}`}
                  style={{ flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                >
                  <input
                    type="radio"
                    name="deliveryType"
                    value={opt.value}
                    checked={formData.deliveryType === opt.value}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <span style={{ fontWeight: 700 }}>{opt.label}</span>
                  <span style={{ fontSize: '0.82rem', color: formData.deliveryType === opt.value ? "white" : 'var(--text-secondary)' }}>{opt.sublabel}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Delivery Details */}
          <section className="form-section">
            <h2 className="section-title">Dados de Entrega</h2>
            <div className="input-row">
              <div className="input-group">
                <label>Nome Completo</label>
                <input
                  type="text"
                  name="fullName"
                  className="input-field"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="input-group">
                <label>Telefone</label>
                <input
                  type="tel"
                  name="phone"
                  className="input-field"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {formData.deliveryType !== 'pickup' && (
              <>
                <div className="input-group">
                  <label>Endereço Completo</label>
                  <input
                    type="text"
                    name="address"
                    className="input-field"
                    placeholder="Rua, Número, Bairro"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Complemento e Ponto de Referência</label>
                  <input
                    type="text"
                    name="complement"
                    className="input-field"
                    value={formData.complement}
                    onChange={handleInputChange}
                  />
                </div>
              </>
            )}
          </section>

          {/* Payment Details */}
          <section className="form-section">
            <h2 className="section-title">Forma de Pagamento</h2>

            <div className="payment-options">
              {['Pix', 'Cartão', 'Dinheiro'].map(method => (
                <label
                  key={method}
                  className={`payment-card ${formData.paymentMethod === method ? 'active' : ''}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method}
                    checked={formData.paymentMethod === method}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <span>{method}</span>
                </label>
              ))}
            </div>

            {formData.paymentMethod === 'Dinheiro' && (
              <div className="change-section animate-fade-in">
                <div className="checkbox-group mt-3">
                  <input
                    type="checkbox"
                    id="requiresChange"
                    name="requiresChange"
                    checked={formData.requiresChange}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="requiresChange">Precisa de troco?</label>
                </div>

                {formData.requiresChange && (
                  <div className="input-group mt-3">
                    <label>Troco para quanto?</label>
                    <input
                      type="number"
                      name="changeFor"
                      className="input-field"
                      placeholder="Ex: 100"
                      value={formData.changeFor}
                      onChange={handleInputChange}
                      min={total}
                      required={formData.requiresChange}
                    />
                  </div>
                )}
              </div>
            )}
          </section>

          <button type="submit" className="btn btn-primary btn-full checkout-submit-btn" disabled={loading || isStoreClosed}
            style={isStoreClosed ? { opacity: 0.5, cursor: 'not-allowed' } : {}}>
            {isStoreClosed ? '🔒 Loja Fechada' : loading ? 'Processando...' : 'Confirmar Pedido'}
          </button>
        </form>

        {/* Order Summary Sidebar */}
        <div className="checkout-summary">
          <h2 className="summary-title">Seu Pedido</h2>

          <div className="summary-items-list">
            {items.map(item => (
              <div key={item._id} className="summary-item-row">
                <span>{item.quantity}x {item.name}</span>
                <span>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="summary-divider"></div>

          <div className="summary-row">
            <span>Subtotal</span>
            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Entrega ({formData.deliveryType === 'pickup' ? 'Retirada' : formData.deliveryType === 'rural' ? 'Rural' : 'Cidade'})</span>
            <span style={{ color: deliveryFee === 0 ? 'var(--success-color)' : 'inherit', fontWeight: deliveryFee === 0 ? 700 : 400 }}>
              {deliveryFee === 0 ? 'GRÁTIS' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deliveryFee)}
            </span>
          </div>

          <div className="summary-row total-row">
            <span>Total a Pagar</span>
            <span className="total-value">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
