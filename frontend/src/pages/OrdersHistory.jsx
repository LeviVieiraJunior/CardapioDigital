import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import './Profile.css';

export default function OrdersHistory() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      let myOrders = res.data.body.filter(o => o.userId === user.id || o.userId === user._id);
      myOrders = myOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(myOrders);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Recebido': return '#f39c12';
      case 'Em Preparo': return '#3498db';
      case 'Saiu para Entrega': return '#9b59b6';
      case 'Entregue': return '#2ecc71';
      default: return '#95a5a6';
    }
  };

  return (
    <div className="page-content container profile-page animate-fade-in">
        <main className="profile-content" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
          <h2 className="section-title">Meu Histórico de Pedidos</h2>
          
          {loading ? (
            <div className="loading-spinner">Carregando seus pedidos...</div>
          ) : orders.length > 0 ? (
            <div className="orders-list">
              {orders.map(order => (
                <div key={order._id} className="order-history-card">
                  <div className="order-card-header">
                    <div>
                      <span className="order-id">Pedido #{order._id.slice(-6).toUpperCase()}</span>
                      <span className="order-date">
                        {new Date(order.createdAt).toLocaleDateString('pt-BR', {
                           day: '2-digit', month: 'short', year: 'numeric',
                           hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div 
                      className="order-status-badge" 
                      style={{ backgroundColor: getStatusColor(order.status || order.pickupStatus) }}
                    >
                      {order.status || order.pickupStatus}
                    </div>
                  </div>
                  
                  <div className="order-card-body">
                    <ul className="order-items-minimal">
                      {order.orderItems?.map(item => (
                        <li key={item._id}>{item.quantity}x {item.price ? `R$ ${item.price}` : 'Item'}</li>
                      ))}
                    </ul>
                    
                    <div className="order-total-info">
                      <p>Entrega: <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.deliveryFee || 5)}</strong></p>
                      <p className="order-final-price">
                        Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.totalAmount || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-orders">
              <p>Você ainda não fez nenhum pedido conosco.</p>
            </div>
          )}
        </main>
    </div>
  );
}
