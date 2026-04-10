/**
 * ============================================================================
 * COMPONENTE: AdminDashboard.jsx
 * ============================================================================
 * PADRÃO DE PROJETO: Painel Administrativo do Lojista (Master View)
 * O QUE ESSE ARQUIVO FAZ:
 * 1. Dividido em 2 abas (Tabs): "Gestão de Pedidos" (Kanban) e "Gerenciar Cardápio".
 * 
 * ABA PEDIDOS (KANBAN):
 * - Carrega os pedidos a cada 30 segundos (setInterval).
 * - Mapeia os pedidos em 4 colunas dependendo da string de status:
 *   [Recebido] -> [Em Preparo] -> [Saiu para Entrega] -> [Entregue].
 * - Lida com Fluxo de Pagamento (getPaymentInfo): Se é PIX ou Cartão, exige 
 *   que o dono clique em "Confirmar Pagamento" para liberar o preparo.
 * 
 * ABA CARDÁPIO (MENU MANAGEMENT):
 * - CRUD de Categorias (Categorias novas ou Deletar).
 * - CRUD de Produtos (Plates): Permite criar nomes, preços e alterar disponibilidade.
 * - FLAG DE PROMOÇÃO: 
 *   Através da caixinha 'Ativar Promoção', o admin define os campos especiais
 *   `originalPrice` (exibe riscado) e `promoText` (exibe uma tag vermelha).
 *   Estes produtos ganham destaque automático na página Inicial.
 * 
 * LÓGICA DE FOTOS:
 *   - A função handleImageUpload pega a foto enviada via input type file, 
 *     usa Canvas puro do HTML5 para comprimir ela usando canvas.toDataURL(jpeg, 0.95),
 *     para evitar salvar Megabytes pesados no banco de dados MongoDB (base64 estático).
 * ============================================================================
 */
import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { jsPDF } from 'jspdf';
import { Package, CheckCircle, Clock, Truck, Plus, Trash2, Edit, X, CreditCard, Banknote, QrCode, AlertCircle, Settings, FileText, Download, Printer } from 'lucide-react';
import { useToastStore } from '../store/toastStore';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [plates, setPlates] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToastStore();

  // Settings State
  const [settingsForm, setSettingsForm] = useState({ cityDeliveryFee: 0, ruralDeliveryFee: 0 });
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Cash Flow States
  const [activeRegister, setActiveRegister] = useState(null);
  const [registerHistory, setRegisterHistory] = useState([]);
  const [cashLoading, setCashLoading] = useState(true);
  const [cashInputValue, setCashInputValue] = useState('');
  const [withdrawReason, setWithdrawReason] = useState('');
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [closedReportData, setClosedReportData] = useState(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState(null);

  // Admin Token (Confirmação de segurança para operações sensíveis do caixa)
  const CACHE_KEY = 'admin-active-tab';
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [pendingAction, setPendingAction] = useState(null); // { type: 'withdraw' | 'reopen', payload: {} }

  // Modal State para Produtos
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [platesSearchTerm, setPlatesSearchTerm] = useState('');
  const [editingPlate, setEditingPlate] = useState(null);
  const [plateForm, setPlateForm] = useState({
    name: '',
    price: '',
    originalPrice: '',
    promoText: '',
    categoryId: '',
    available: true,
    isPromotion: false,
    description: '',
    image: ''
  });

  useEffect(() => {
    fetchDashboardData();
    fetchSettings();
    fetchActiveRegister();
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveRegister = async () => {
    try {
      setCashLoading(true);
      const res = await api.get('/cash-registers/active');
      setActiveRegister(res.data.body || null);
      if (!res.data.body) {
        // se não tem ativo, busca histórico
        const histRes = await api.get('/cash-registers');
        setRegisterHistory(histRes.data.body || []);
      }
    } catch (e) { console.error('Erro ao buscar fluxo de caixa', e); }
    finally { setCashLoading(false); }
  };

  const openCashRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/cash-registers/open', { initialValue: cashInputValue });
      setActiveRegister(res.data.body);
      setCashInputValue('');
      addToast('Caixa aberto com sucesso! Loja disponível para pedidos.', 'success');
    } catch (error) { addToast(error.response?.data?.text || 'Erro ao abrir caixa', 'error'); }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!activeRegister) return;
    // Abre o modal de token antes de executar a sangria
    setPendingAction({ type: 'withdraw' });
    setTokenInput('');
    setTokenError('');
    setIsWithdrawModalOpen(false);
    setIsTokenModalOpen(true);
  };

  const handleReopenRegister = (registerId) => {
    // Guarda qual caixa será reaberto e abre o token modal
    setPendingAction({ type: 'reopen', registerId });
    setTokenInput('');
    setTokenError('');
    setIsTokenModalOpen(true);
  };

  const handleAdminAction = async () => {
    try {
      // Verificamos no backend de forma segura
      await api.post('/auth/verify-admin-token', { token: tokenInput });
    } catch (error) {
      setTokenError('Token incorreto. Verifique e tente novamente.');
      return;
    }

    setIsTokenModalOpen(false);
    setTokenInput('');
    setTokenError('');

    if (pendingAction?.type === 'withdraw') {
      try {
        const res = await api.post(`/cash-registers/${activeRegister._id}/withdraw`, { value: cashInputValue, reason: withdrawReason });
        setActiveRegister(res.data.body);
        setCashInputValue('');
        setWithdrawReason('');
        addToast('Sangria registrada com sucesso.', 'success');
      } catch { addToast('Erro ao registrar sangria', 'error'); }
    }

    if (pendingAction?.type === 'reopen') {
      try {
        // Reabertura = abrir um novo caixa (o anterior já está fechado)
        const res = await api.post('/cash-registers/open', { initialValue: cashInputValue || 0 });
        setActiveRegister(res.data.body);
        setRegisterHistory([]);
        setCashInputValue('');
        addToast('Caixa reaberto com sucesso! Loja liberada para novos pedidos.', 'success');
      } catch (error) { addToast(error.response?.data?.text || 'Erro ao reabrir caixa', 'error'); }
    }

    setPendingAction(null);
  };

  const handleCloseRegister = async () => {
    if (!activeRegister) return;
    try {
      const res = await api.post(`/cash-registers/${activeRegister._id}/close`, { closedBy: 'Admin' });
      setClosedReportData(res.data.body); // guarda para tela de relatório
      setActiveRegister(null);
      setIsCloseModalOpen(false);
      addToast('Caixa fechado com sucesso. Loja bloqueada para novos pedidos.', 'success');
      // Recarrega o histórico
      const histRes = await api.get('/cash-registers');
      setRegisterHistory(histRes.data.body || []);
    } catch { addToast('Erro ao fechar caixa', 'error'); }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data.body) {
        setSettingsForm({
          cityDeliveryFee: res.data.body.cityDeliveryFee || 0,
          ruralDeliveryFee: res.data.body.ruralDeliveryFee || 0
        });
      }
    } catch (e) { console.error('Erro ao carregar configurações', e); }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    try {
      await api.put('/settings', {
        cityDeliveryFee: Number(settingsForm.cityDeliveryFee),
        ruralDeliveryFee: Number(settingsForm.ruralDeliveryFee)
      });
      alert('Configurações de entrega salvas com sucesso!');
    } catch { alert('Erro ao salvar configurações.'); }
    finally { setSettingsLoading(false); }
  };

  const fetchDashboardData = async () => {
    try {
      const [ordRes, catRes, platesRes] = await Promise.all([
        api.get('/orders'),
        api.get('/categories'),
        api.get('/plates')
      ]);
      setOrders(ordRes.data.body?.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)) || []);
      setCategories(catRes.data.body || []);
      setPlates(platesRes.data.body || []);
    } catch (error) {
      console.error('Erro ao listar dados do painel:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}`, { status: newStatus });
      setOrders(orders.map(o => o._id === orderId ? { ...o, status: newStatus, pickupStatus: newStatus } : o));
    } catch { addToast('Erro ao atualizar status', 'error'); }
  };

  const confirmPayment = async (orderId) => {
    try {
      await api.put(`/orders/${orderId}`, { paymentStatus: 'Aprovado' });
      setOrders(orders.map(o => o._id === orderId ? { ...o, paymentStatus: 'Aprovado' } : o));
    } catch { addToast('Erro ao confirmar pagamento', 'error'); }
  };

  const getPaymentInfo = (order) => {
    const method = order.paymentMethod || 'Dinheiro';
    if (method === 'Dinheiro') {
      return { icon: <Banknote size={13}/>, label: 'Dinheiro', status: 'Na Entrega', color: 'pay-cash' };
    }
    const approved = order.paymentStatus === 'Aprovado';
    const color = approved ? 'pay-approved' : 'pay-pending';
    const status = approved ? 'Aprovado' : 'Aguardando';
    const icon = method === 'Pix' ? <QrCode size={13}/> : <CreditCard size={13}/>;
    return { icon, label: method, status, color, approved };
  };

  /* ----- GERENCIAMENTO DE CATEGORIAS ----- */
  const handleAddCategory = async () => {
    const name = prompt('Nome da nova categoria:');
    if (!name) return;
    try {
      const res = await api.post('/categories', { name });
      setCategories([...categories, { _id: res.data.body.insertedId, name }]);
      addToast(`Categoria "${name}" criada!`, 'success');
    } catch { addToast('Erro ao criar categoria.', 'error'); }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('Excluir esta categoria? Os produtos atrelados a ela ficarão sem categoria.')) {
      try {
        await api.delete(`/categories/${id}`);
        setCategories(categories.filter(c => c._id !== id));
        addToast('Categoria excluída.', 'warning');
      } catch { addToast('Erro ao excluir categoria.', 'error'); }
    }
  }

  /* ----- GERENCIAMENTO DE PRODUTOS ----- */
  const openPlateModal = (plate = null, isPromo = false) => {
    if (plate) {
      setEditingPlate(plate._id);
      setPlateForm({
        name: plate.name || '',
        price: isPromo ? '' : (plate.price || ''),
        originalPrice: isPromo ? (plate.price || '') : (plate.originalPrice || ''),
        promoText: plate.promoText || '',
        categoryId: plate.categoryId || plate.category || '',
        available: plate.available !== false,
        isPromotion: isPromo || plate.isPromotion || false,
        description: plate.description || '',
        image: plate.image || ''
      });
    } else {
      setEditingPlate(null);
      setPlateForm({
        name: '', price: '', originalPrice: '', promoText: '', categoryId: categories[0]?._id || '', available: true, isPromotion: isPromo, description: '', image: ''
      });
    }
    setIsModalOpen(true);
  };

  const handlePromotionToggle = (checked) => {
    setPlateForm(prev => {
      if (checked) {
        // Ativando promoção: preço atual vai para "De", campo "Por" limpa
        return {
          ...prev,
          isPromotion: true,
          originalPrice: prev.price || '',
          price: ''
        };
      } else {
        // Desativando promoção: preço "De" volta para o principal, limpa promo
        return {
          ...prev,
          isPromotion: false,
          price: prev.originalPrice || prev.price,
          originalPrice: '',
          promoText: ''
        };
      }
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match('image.*')) {
        addToast('Por favor, selecione apenas imagens.', 'warning');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Transforma em JPEG alta qualidade (95%) e manda pro state
          const resizedImage = canvas.toDataURL('image/jpeg', 0.95);
          setPlateForm({ ...plateForm, image: resizedImage });
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePlateSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { 
        ...plateForm, 
        price: Number(plateForm.price),
        originalPrice: plateForm.originalPrice ? Number(plateForm.originalPrice) : null,
        promoText: plateForm.promoText || null
      };
      
      if (editingPlate) {
        await api.put(`/plates/${editingPlate}`, payload);
        addToast('Produto atualizado com sucesso!', 'success');
      } else {
        await api.post('/plates', payload);
        addToast('Produto criado com sucesso!', 'success');
      }
      
      setIsModalOpen(false);
      fetchDashboardData();
    } catch {
      addToast('Erro ao salvar produto.', 'error');
    }
  };

  const togglePlateAvailability = async (plate) => {
    try {
      const newStatus = plate.available === false ? true : false;
      await api.put(`/plates/${plate._id}`, { available: newStatus });
      setPlates(plates.map(p => p._id === plate._id ? { ...p, available: newStatus } : p));
      addToast(newStatus ? 'Produto marcado como disponível.' : 'Produto marcado como esgotado.', newStatus ? 'success' : 'warning');
    } catch { addToast('Erro ao mudar disponibilidade.', 'error'); }
  };

  const deletePlate = async (id) => {
    if (window.confirm('Excluir produto definitivamente?')) {
      try {
        await api.delete(`/plates/${id}`);
        setPlates(plates.filter(p => p._id !== id));
        addToast('Produto excluído.', 'warning');
      } catch { addToast('Erro ao excluir.', 'error'); }
    }
  };

  const getCategoryName = (catId) => {
    const cat = categories.find(c => c._id === catId);
    return cat ? cat.name : 'Sem categoria';
  };

  if (loading && orders.length === 0) {
    return <div className="page-content container loading-spinner">Carregando painel...</div>;
  }

  return (
    <div className="page-content container admin-dashboard animate-fade-in">
      <div className="admin-header">
        <h1 className="page-title">Painel Administrativo</h1>
        <div className="admin-tabs">
          <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
            Gestão de Pedidos
          </button>
          <button className={`tab-btn ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')}>
            Produtos
          </button>
          <button className={`tab-btn ${activeTab === 'cash' ? 'active' : ''}`} onClick={() => setActiveTab('cash')}>
            Fluxo de Caixa
          </button>
          <button className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            Configurações
          </button>
        </div>
      </div>

      {/* ABA DE PEDIDOS (KANBAN) */}
      {activeTab === 'orders' && (
        <div className="orders-kanban">
          {['Recebido', 'Em Preparo', 'Saiu para Entrega', 'Entregue'].map(colStatus => (
            <div key={colStatus} className="kanban-col">
              <h3 className="kanban-col-title">
                {colStatus === 'Recebido' && <Clock size={18}/>}
                {colStatus === 'Em Preparo' && <Package size={18}/>}
                {colStatus === 'Saiu para Entrega' && <Truck size={18}/>}
                {colStatus === 'Entregue' && <CheckCircle size={18}/>}
                {colStatus} ({orders.filter(o => (o.status || o.pickupStatus) === colStatus).length})
              </h3>
              
              <div className="kanban-cards">
                {orders.filter(o => (o.status || o.pickupStatus) === colStatus).map(order => {
                  const payInfo = getPaymentInfo(order);
                  const paymentPending = order.paymentMethod !== 'Dinheiro' && order.paymentStatus !== 'Aprovado';
                  return (
                  <div key={order._id} className={`kanban-card ${paymentPending ? 'card-payment-pending' : ''}`}>
                    <div className="kb-header">
                      <strong>#{order._id.slice(-5).toUpperCase()}</strong>
                      <span>{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>

                    {/* PAYMENT STATUS BANNER */}
                    <div className={`kb-payment-bar ${payInfo.color}`}>
                      <span className="kb-payment-method">
                        {payInfo.icon} {payInfo.label}
                      </span>
                      <span className="kb-payment-status">
                        {paymentPending && <AlertCircle size={12}/>}
                        {payInfo.status}
                      </span>
                    </div>

                    <div className="kb-body">
                      <p><strong>Cliente:</strong> {order.customerName}</p>
                      <p><strong>Tel:</strong> {order.customerPhone}</p>
                      <p className="address">📍 {order.deliveryAddress}</p>
                      <hr className="kb-divider" />
                      <div className="kb-items">
                        {(order.orderItems || []).map(i => (
                          <div key={i._id} className="kb-item-row">
                            <span>{i.quantity}x</span>
                            {plates.find(p => p._id === String(i.plateId))?.name || `Item #${String(i.plateId).slice(-4)}`}
                          </div>
                        ))}
                      </div>
                      <p className="kb-total">
                        Total: R$ {Number(order.totalAmount || 0).toFixed(2)}
                        {order.paymentMethod === 'Dinheiro' && order.requiresChange && ` (Troco p/ R$${order.changeFor})`}
                      </p>
                    </div>
                    
                    <div className="kb-actions" style={{ flexDirection: 'column', gap: '6px' }}>
                      {/* Confirm payment button — only for Pix/Card not yet approved */}
                      {paymentPending && (
                        <button onClick={() => confirmPayment(order._id)} className="kb-btn pay-confirm-btn">
                          ✅ Confirmar Pagamento
                        </button>
                      )}
                      {colStatus === 'Recebido' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'Em Preparo')}
                          className="kb-btn primary"
                          disabled={paymentPending}
                          title={paymentPending ? 'Confirme o pagamento antes de iniciar o preparo' : ''}
                          style={{ opacity: paymentPending ? 0.4 : 1 }}
                        >
                          Aceitar e Preparar
                        </button>
                      )}
                      {colStatus === 'Em Preparo' && <button onClick={() => updateOrderStatus(order._id, 'Saiu para Entrega')} className="kb-btn warning">Despachar</button>}
                      {colStatus === 'Saiu para Entrega' && <button onClick={() => updateOrderStatus(order._id, 'Entregue')} className="kb-btn success">Entregue</button>}
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ABA DE GERENCIAMENTO DE CARDÁPIO */}
      {activeTab === 'menu' && (
        <div className="menu-management animate-fade-in">
          
          <div className="menu-mgmt-section">
            <div className="section-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
               <h2 style={{ margin: 0 }}>Categorias</h2>
               <button className="btn btn-primary" onClick={handleAddCategory}><Plus size={16}/> Nova Categoria</button>
            </div>
            {categories.length === 0 ? <p className="text-muted">Nenhuma categoria criada.</p> : (
              <ul className="admin-list">
                {categories.map(cat => (
                  <li key={cat._id}>
                    <span>{cat.name}</span>
                    <button onClick={() => handleDeleteCategory(cat._id)} className="action-btn text-danger" title="Excluir Categoria"><Trash2 size={18}/></button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="menu-mgmt-section" style={{marginTop: '2rem'}}>
            <div className="section-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
               <h2 style={{ margin: 0 }}>Produtos do Cardápio</h2>
               <div style={{ display: 'flex', gap: '8px' }}>
                 <button className="btn btn-warning" onClick={() => setIsSelectorOpen(true)}><Plus size={16}/> Montar Promoção</button>
                 <button className="btn btn-primary" onClick={() => openPlateModal()}><Plus size={16}/> Novo Produto</button>
               </div>
            </div>

            <div className="filter-container" style={{ marginBottom: '1.2rem' }}>
              <input 
                type="text" 
                className="input-field" 
                placeholder="🔍 Pesquisar produto por nome..." 
                value={platesSearchTerm}
                onChange={(e) => setPlatesSearchTerm(e.target.value)}
                style={{ maxWidth: '400px' }}
              />
            </div>
            
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Categoria</th>
                    <th>Preço (R$)</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {plates
                    .filter(p => !platesSearchTerm || p.name.toLowerCase().includes(platesSearchTerm.toLowerCase()))
                    .map(plate => (
                    <tr key={plate._id}>
                      <td style={{ fontWeight: '600' }}>{plate.name}</td>
                      <td>{getCategoryName(plate.categoryId || plate.category)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          R$ {Number(plate.price || 0).toFixed(2)}
                          {plate.isPromotion && (
                            <span style={{ 
                              background: 'var(--primary-color)', 
                              color: 'white', 
                              padding: '4px 8px', 
                              borderRadius: '6px', 
                              fontSize: '0.7rem', 
                              fontWeight: 900,
                              display: 'inline-block',
                              marginLeft: '8px',
                              flexShrink: 0,
                              whiteSpace: 'nowrap'
                            }}>
                              PROMOÇÃO
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <button 
                          onClick={() => togglePlateAvailability(plate)}
                          className={`status-badge ${plate.available !== false ? 'status-active' : 'status-inactive'}`}
                          title="Clique para alterar a disponibilidade"
                        >
                          {plate.available !== false ? '✅ Disponível' : '❌ Esgotado'}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => openPlateModal(plate)} className="action-btn" style={{ color: 'var(--primary-color)' }} title="Editar Produto"><Edit size={18}/></button>
                          <button onClick={() => deletePlate(plate._id)} className="action-btn text-danger" title="Excluir Produto"><Trash2 size={18}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {plates.length === 0 && (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Nenhum produto cadastrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ABA FLUXO DE CAIXA */}
      {activeTab === 'cash' && (
        <div className="animate-fade-in" style={{ padding: '1rem 0' }}>

          {cashLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Carregando dados do caixa...</div>
          ) : !activeRegister ? (
            /* === CAIXA FECHADO === */
            <div>
              <div style={{ background: 'linear-gradient(135deg, #FFF8F3 0%, #FFE8D6 100%)', border: '2px dashed var(--primary-color)', borderRadius: '20px', padding: '3rem', textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #FF6B2B, #FF8C5A)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 8px 24px rgba(255,107,43,0.3)' }}>
                  <Banknote size={36} color="white" />
                </div>
                <h2 style={{ color: 'var(--secondary-color)', marginBottom: '0.5rem' }}>Caixa Fechado</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>O estabelecimento está fechado para novos pedidos. Abra o caixa para liberar o cardápio.</p>
                <form onSubmit={openCashRegister} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', maxWidth: '360px', margin: '0 auto' }}>
                  <div className="input-group" style={{ width: '100%', marginBottom: 0 }}>
                    <label>Valor de Abertura (Troco Inicial)</label>
                    <input
                      type="number" step="0.01" min="0" className="input-field"
                      placeholder="Ex: R$ 50,00"
                      value={cashInputValue}
                      onChange={(e) => setCashInputValue(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.9rem' }}>
                    <Banknote size={18} /> Abrir Caixa e Iniciar Expediente
                  </button>
                </form>
              </div>

              {/* Histórico de caixas anteriores */}
              {registerHistory.length > 0 && (
                <div>
                  <h3 style={{ marginBottom: '1rem', color: 'var(--secondary-color)' }}>Histórico de Caixas</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {registerHistory.map(reg => (
                      <div key={reg._id} style={{ background: 'white', borderRadius: '12px', padding: '1.2rem 1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <strong style={{ display: 'block', color: 'var(--secondary-color)' }}>
                            {new Date(reg.openedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} — {new Date(reg.openedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </strong>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {reg.ordersCount || 0} pedido(s) • Abertura: R$ {Number(reg.initialValue).toFixed(2)}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-end' }}>
                          <strong style={{ color: 'var(--primary-color)', fontSize: '1.1rem', display: 'block' }}>R$ {Number(reg.totals?.totalSold || 0).toFixed(2)}</strong>
                          <span style={{ fontSize: '0.8rem', background: '#ECFDF5', color: '#059669', padding: '2px 10px', borderRadius: '20px', fontWeight: 700 }}>Fechado</span>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              className="btn"
                              style={{ fontSize: '0.78rem', padding: '4px 12px', background: '#F5EFE9', color: 'var(--secondary-color)' }}
                              onClick={() => { setSelectedSummary(reg); setIsSummaryModalOpen(true); }}
                            >
                              📄 Ver Resumo
                            </button>
                            <button
                              className="btn btn-warning"
                              style={{ fontSize: '0.78rem', padding: '4px 12px' }}
                              onClick={() => handleReopenRegister(reg._id)}
                            >
                              🔓 Reabrir
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* === CAIXA ABERTO === */
            <div>
              {/* Relatório de caixa recém-fechado (após fechar, mostra antes de sumir) */}
              {closedReportData && (
                <div style={{ background: '#ECFDF5', border: '1.5px solid #059669', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
                  <h3 style={{ color: '#059669', marginBottom: '1rem' }}>✅ Caixa Fechado — Relatório Final</h3>
                  <p><strong>Total Vendido:</strong> R$ {Number(closedReportData.totals?.totalSold || 0).toFixed(2)}</p>
                  <p><strong>Dinheiro:</strong> R$ {Number(closedReportData.totals?.Dinheiro || 0).toFixed(2)}</p>
                  <p><strong>Pix:</strong> R$ {Number(closedReportData.totals?.Pix || 0).toFixed(2)}</p>
                  <p><strong>Cartão:</strong> R$ {Number(closedReportData.totals?.['Cartão'] || 0).toFixed(2)}</p>
                  <p><strong>Total de Sangrias:</strong> R$ {Number(closedReportData.totalWithdrawals || 0).toFixed(2)}</p>
                  <p><strong>Saldo de Gaveta Esperado:</strong> R$ {Number(closedReportData.expectedCashBal || 0).toFixed(2)}</p>
                  <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => { window.print(); }}>🖨️ Imprimir / Salvar PDF</button>
                  <button className="btn" style={{ marginTop: '1rem', marginLeft: '1rem', background: 'transparent', border: '1px solid #059669', color: '#059669' }} onClick={() => setClosedReportData(null)}>Fechar</button>
                </div>
              )}

              {/* Header do Caixa Aberto */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <span style={{ display: 'inline-block', background: '#ECFDF5', color: '#059669', padding: '4px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem' }}>🟢 Caixa Aberto</span>
                  <h2 style={{ margin: 0, color: 'var(--secondary-color)' }}>Expediente em Andamento</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '4px 0 0' }}>
                    Aberto em: {new Date(activeRegister.openedAt).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.7rem' }}>
                  <button className="btn btn-warning" onClick={() => { setCashInputValue(''); setWithdrawReason(''); setIsWithdrawModalOpen(true); }}>
                    <Banknote size={16} /> Nova Sangria
                  </button>
                  <button className="btn btn-outline-danger" onClick={() => setIsCloseModalOpen(true)}>
                    Fechar Caixa
                  </button>
                </div>
              </div>

              {/* Cards de Totais */}
              {(() => {
                const cashOrders = orders.filter(o => o.cashRegisterId === activeRegister._id?.toString() || o.cashRegisterId === activeRegister._id);
                const totDinheiro = cashOrders.filter(o => o.paymentMethod === 'Dinheiro').reduce((s,o) => s + Number(o.total||0), 0);
                const totPix     = cashOrders.filter(o => o.paymentMethod === 'Pix').reduce((s,o) => s + Number(o.total||0), 0);
                const totCartao  = cashOrders.filter(o => o.paymentMethod === 'Cartão').reduce((s,o) => s + Number(o.total||0), 0);
                const totVendido = totDinheiro + totPix + totCartao;
                const totSangria = (activeRegister.withdrawals || []).reduce((s,w) => s + Number(w.value||0), 0);
                const saldoGaveta = Number(activeRegister.initialValue||0) + totDinheiro - totSangria;
                const cards = [
                  { label: 'Total Vendido', value: totVendido, icon: '💰', color: '#3B82F6' },
                  { label: 'Dinheiro', value: totDinheiro, icon: '💵', color: '#059669' },
                  { label: 'Pix', value: totPix, icon: '📱', color: '#7C3AED' },
                  { label: 'Cartão', value: totCartao, icon: '💳', color: '#D97706' },
                  { label: 'Sangrias', value: -totSangria, icon: '⬇️', color: '#DC2626' },
                  { label: 'Saldo Gaveta', value: saldoGaveta, icon: '🗂️', color: '#FF6B2B' },
                ];
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    {cards.map(c => (
                      <div key={c.label} style={{ background: 'white', borderRadius: '14px', padding: '1.2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', borderLeft: `4px solid ${c.color}` }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>{c.icon}</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: c.color }}>R$ {Math.abs(c.value).toFixed(2)}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{c.label}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Pedidos do Caixa Atual */}
              <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--secondary-color)' }}>Pedidos deste Expediente</h3>
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Pedido</th><th>Cliente</th><th>Pagamento</th><th>Hora</th><th>Total</th><th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.filter(o => o.cashRegisterId === activeRegister._id?.toString() || o.cashRegisterId === activeRegister._id).map(o => (
                        <tr key={o._id}>
                          <td><strong>#{o._id.slice(-5).toUpperCase()}</strong></td>
                          <td>{o.customerName}</td>
                          <td>{o.paymentMethod}</td>
                          <td>{new Date(o.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                          <td><strong style={{ color: 'var(--primary-color)' }}>R$ {Number(o.total||0).toFixed(2)}</strong></td>
                          <td><span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{o.status || o.pickupStatus}</span></td>
                        </tr>
                      ))}
                      {orders.filter(o => o.cashRegisterId === activeRegister._id?.toString()).length === 0 && (
                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Nenhum pedido registrado neste expediente.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Histórico de Sangrias */}
              {(activeRegister.withdrawals?.length > 0) && (
                <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
                  <h3 style={{ marginBottom: '1rem', color: 'var(--secondary-color)' }}>Sangrias Realizadas</h3>
                  {activeRegister.withdrawals.map(w => (
                    <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0', borderBottom: '1px solid #F5EFE9' }}>
                      <div>
                        <strong style={{ display: 'block' }}>{w.reason}</strong>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{new Date(w.timestamp).toLocaleString('pt-BR')}</span>
                      </div>
                      <strong style={{ color: '#DC2626' }}>- R$ {Number(w.value).toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MODAL DE SANGRIA */}
          {isWithdrawModalOpen && (
            <div className="modal-overlay">
              <div className="modal-content animate-fade-in" style={{ maxWidth: '450px' }}>
                <div className="modal-header">
                  <h2>Nova Sangria</h2>
                  <button className="close-btn" onClick={() => setIsWithdrawModalOpen(false)}><X size={24}/></button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleWithdraw}>
                    <div className="input-group">
                      <label>Valor da Retirada (R$)</label>
                      <input type="number" step="0.01" min="0.01" className="input-field" placeholder="Ex: 100,00"
                        value={cashInputValue} onChange={e => setCashInputValue(e.target.value)} required />
                    </div>
                    <div className="input-group">
                      <label>Motivo</label>
                      <input type="text" className="input-field" placeholder="Ex: Pagamento fornecedor, troco..."
                        value={withdrawReason} onChange={e => setWithdrawReason(e.target.value)} required />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                      <button type="button" className="btn" style={{ flex: 1, background: '#F5EFE9', color: 'var(--secondary-color)' }} onClick={() => setIsWithdrawModalOpen(false)}>Cancelar</button>
                      <button type="submit" className="btn btn-warning" style={{ flex: 1 }}><Banknote size={16}/> Registrar Sangria</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* MODAL CONFIRMAÇÃO FECHAR CAIXA */}
          {isCloseModalOpen && (
            <div className="modal-overlay">
              <div className="modal-content animate-fade-in" style={{ maxWidth: '480px' }}>
                <div className="modal-header">
                  <h2>⚠️ Fechar Caixa</h2>
                  <button className="close-btn" onClick={() => setIsCloseModalOpen(false)}><X size={24}/></button>
                </div>
                <div className="modal-body">
                  <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    Ao fechar o caixa, o cardápio será bloqueado para novos pedidos e um relatório final será gerado.{' '}
                    <strong>Esta ação não pode ser desfeita.</strong> Deseja continuar?
                  </p>
                  {(() => {
                    const cashOrders = orders.filter(o => o.cashRegisterId === activeRegister._id?.toString() || o.cashRegisterId === activeRegister._id);
                    const totVendido = cashOrders.reduce((s,o) => s + Number(o.total||0), 0);
                    const totSangria = (activeRegister.withdrawals||[]).reduce((s,w) => s + Number(w.value||0), 0);
                    return (
                      <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Abertura:</span><strong>R$ {Number(activeRegister.initialValue||0).toFixed(2)}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total Vendido:</span><strong>R$ {totVendido.toFixed(2)}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#DC2626' }}><span>Sangrias:</span><strong>- R$ {totSangria.toFixed(2)}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E5E7EB', paddingTop: '0.5rem', fontWeight: 900, color: 'var(--primary-color)' }}>
                          <span>Pedidos no Caixa:</span><strong>{cashOrders.length}</strong>
                        </div>
                      </div>
                    );
                  })()}
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn" style={{ flex: 1, background: '#F5EFE9', color: 'var(--secondary-color)' }} onClick={() => setIsCloseModalOpen(false)}>Cancelar</button>
                    <button className="btn btn-outline-danger" style={{ flex: 1 }} onClick={handleCloseRegister}>Confirmar Fechamento</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODAL DE TOKEN DE ADMIN */}
          {isTokenModalOpen && (
            <div className="modal-overlay">
              <div className="modal-content animate-fade-in" style={{ maxWidth: '400px' }}>
                <div className="modal-header">
                  <h2>🔐 Token de Admin</h2>
                  <button className="close-btn" onClick={() => { setIsTokenModalOpen(false); setPendingAction(null); }}><X size={24}/></button>
                </div>
                <div className="modal-body">
                  <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg, #FF6B2B, #FF8C5A)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: '0 6px 20px rgba(255,107,43,0.3)' }}>
                      <Banknote size={28} color="white" />
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                      {pendingAction?.type === 'reopen'
                        ? 'Insira o token de admin para realizar a reabertura do caixa.'
                        : 'Insira o token de admin para autorizar a sangria.'}
                    </p>
                  </div>

                  <div className="input-group">
                    <label>Token de Admin</label>
                    <input
                      type="password"
                      className="input-field"
                      placeholder="Digite o token..."
                      value={tokenInput}
                      onChange={e => { setTokenInput(e.target.value); setTokenError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleAdminAction()}
                      autoFocus
                      style={{ letterSpacing: '0.2em', fontSize: '1.1rem', textAlign: 'center' }}
                    />
                    {tokenError && (
                      <p style={{ color: '#DC2626', fontSize: '0.85rem', marginTop: '6px', fontWeight: 600 }}>
                        ⚠️ {tokenError}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.2rem' }}>
                    <button className="btn" style={{ flex: 1, background: '#F5EFE9', color: 'var(--secondary-color)' }}
                      onClick={() => { setIsTokenModalOpen(false); setPendingAction(null); setTokenInput(''); setTokenError(''); }}>
                      Cancelar
                    </button>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAdminAction}>
                      Confirmar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL SELETOR DE PRODUTOS PARA PROMOÇÃO */}
      {isSelectorOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>Escolha um Produto para Promoção</h2>
              <button className="close-btn" onClick={() => setIsSelectorOpen(false)}><X size={24} /></button>
            </div>
            <div className="modal-body">
              <input 
                type="text" 
                className="input-field" 
                placeholder="Pesquisar produto pelo nome..." 
                style={{ marginBottom: '1rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #F5EFE9', borderRadius: '12px' }}>
                {plates.filter(p => !p.isPromotion && p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                  <div 
                    key={p._id} 
                    className="selector-item"
                    onClick={() => {
                       setIsSelectorOpen(false);
                       setSearchTerm('');
                       openPlateModal(p, true);
                    }}
                    style={{ 
                      padding: '1rem', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      borderBottom: '1px solid #F5EFE9'
                    }}
                  >
                    <div>
                      <strong style={{ display: 'block' }}>{p.name}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {getCategoryName(p.categoryId || p.category)} • R$ {Number(p.price).toFixed(2)}
                      </span>
                    </div>
                    <Plus size={18} color="var(--primary-color)" />
                  </div>
                ))}
                {plates.filter(p => !p.isPromotion && p.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Nenhum produto (que já não seja promoção) encontrado.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PRODUTO */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <div className="modal-header">
              <h2>{editingPlate ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            
            <form onSubmit={handlePlateSubmit} className="modal-body">
              <div className="input-group">
                <label>Nome do Produto</label>
                <input 
                  type="text" className="input-field" required
                  value={plateForm.name} onChange={(e) => setPlateForm({...plateForm, name: e.target.value})}
                />
              </div>

              {!plateForm.isPromotion && (
              <div className="form-row">
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Preço (R$)</label>
                  <input 
                    type="number" step="0.01" className="input-field" required
                    value={plateForm.price} onChange={(e) => setPlateForm({...plateForm, price: e.target.value})}
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Categoria</label>
                  <select 
                    className="input-field" required
                    value={plateForm.categoryId} onChange={(e) => setPlateForm({...plateForm, categoryId: e.target.value})}
                  >
                    <option value="" disabled>Selecione...</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              )}
              {plateForm.isPromotion && (
              <div className="form-row">
                <div className="input-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                  <label>Categoria</label>
                  <select 
                    className="input-field" required
                    value={plateForm.categoryId} onChange={(e) => setPlateForm({...plateForm, categoryId: e.target.value})}
                  >
                    <option value="" disabled>Selecione...</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              )}

              <div className="input-group">
                <label>Descrição Opcional</label>
                <textarea 
                  className="input-field" rows="2"
                  value={plateForm.description} onChange={(e) => setPlateForm({...plateForm, description: e.target.value})}
                />
              </div>

              <div className="input-group">
                <label>Imagem do Produto</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input 
                    type="text" className="input-field" placeholder="Gere URL externa ou envie arquivo lado..."
                    value={plateForm.image} onChange={(e) => setPlateForm({...plateForm, image: e.target.value})}
                    style={{ flex: 1, textOverflow: 'ellipsis' }}
                  />
                  <label className="btn" style={{ cursor: 'pointer', backgroundColor: '#f1f2f6', border: '1px solid #dfe4ea', margin: 0, padding: '0.75rem 1rem' }}>
                    Enviar Foto
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                  </label>
                </div>
              </div>

              <div className="form-row" style={{ marginTop: '1rem' }}>
                <div style={{ padding: '0.8rem', backgroundColor: '#F5EFE9', borderRadius: 'var(--border-radius-md)' }}>
                  <input 
                    type="checkbox" id="plateAvailable" 
                    checked={plateForm.available} onChange={(e) => setPlateForm({...plateForm, available: e.target.checked})}
                  />
                  <label htmlFor="plateAvailable" style={{ fontWeight: 600, marginLeft: '8px' }}>Produto Disponível</label>
                </div>
                <div style={{ padding: '0.8rem', backgroundColor: plateForm.isPromotion ? 'var(--primary-color)' : 'var(--primary-light)', borderRadius: 'var(--border-radius-md)', color: plateForm.isPromotion ? "white" : 'var(--primary-color)', transition: 'all 0.2s' }}>
                  <input 
                    type="checkbox" id="isPromotion" 
                    checked={plateForm.isPromotion} onChange={(e) => handlePromotionToggle(e.target.checked)}
                    style={{ accentColor: plateForm.isPromotion ? "white" : 'var(--primary-color)' }}
                  />
                  <label htmlFor="isPromotion" style={{ fontWeight: 800, marginLeft: '8px', cursor: 'pointer' }}>Ativar Promoção</label>
                </div>
              </div>

              {plateForm.isPromotion && (
                <div className="form-row" style={{ background: '#FFF0E8', padding: '1rem', borderRadius: 'var(--border-radius-md)', border: '1px solid rgba(255,107,43,0.3)' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Preço (De)</label>
                    <input 
                      type="number" step="0.01" className="input-field" placeholder="Riscado (Opcional)"
                      value={plateForm.originalPrice} onChange={(e) => setPlateForm({...plateForm, originalPrice: e.target.value})}
                      style={{ padding: '0.6rem 0.8rem', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label style={{ color: 'var(--primary-hover)', fontSize: '0.75rem' }}>Preço (Por)</label>
                    <input 
                      type="number" step="0.01" className="input-field" required placeholder="Valor final"
                      value={plateForm.price} onChange={(e) => setPlateForm({...plateForm, price: e.target.value})}
                      style={{ borderColor: 'var(--primary-color)', padding: '0.6rem 0.8rem', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                    <label style={{ color: 'var(--primary-hover)' }}>Texto Destaque (Etiqueta)</label>
                    <input 
                      type="text" className="input-field" placeholder="Ex: Pague 1 Leve 2, ou -30% OFF, ou Opcional..."
                      value={plateForm.promoText} onChange={(e) => setPlateForm({...plateForm, promoText: e.target.value})}
                    />
                  </div>
                </div>
              )}
              <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn" onClick={() => setIsModalOpen(false)} style={{ backgroundColor: '#f1f2f6' }}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar Produto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ABA DE CONFIGURAÇÕES */}
      {activeTab === 'settings' && (
        <div className="menu-management animate-fade-in">
          <div className="menu-mgmt-section">
            <div className="section-head">
              <h2>Taxas de Entrega</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Defina os valores fixos de entrega que serão cobrados automaticamente no checkout do cliente.</p>

            <form onSubmit={handleSaveSettings} style={{ backgroundColor: "white", padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', maxWidth: '500px' }}>
              <div className="input-group">
                <label>🏙️ Taxa Cidade / Urbana (R$)</label>
                <input
                  type="number" step="0.01" min="0" className="input-field" required
                  value={settingsForm.cityDeliveryFee}
                  onChange={(e) => setSettingsForm({...settingsForm, cityDeliveryFee: e.target.value})}
                  placeholder="Ex: 5.00"
                />
              </div>

              <div className="input-group">
                <label>🌾 Taxa Rural / Interior (R$)</label>
                <input
                  type="number" step="0.01" min="0" className="input-field" required
                  value={settingsForm.ruralDeliveryFee}
                  onChange={(e) => setSettingsForm({...settingsForm, ruralDeliveryFee: e.target.value})}
                  placeholder="Ex: 10.00"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={settingsLoading}>
                {settingsLoading ? 'Salvando...' : 'Salvar Configurações'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE RESUMO DE CAIXA (HISTÓRICO) */}
      {isSummaryModalOpen && selectedSummary && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={24} color="var(--primary-color)" />
                <h2 style={{ margin: 0 }}>Resumo do Caixa</h2>
              </div>
              <button className="close-btn" onClick={() => setIsSummaryModalOpen(false)}><X size={24}/></button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#F8FAFC', padding: '1.2rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Abertura</span>
                        <strong>{new Date(selectedSummary.openedAt).toLocaleString('pt-BR')}</strong>
                    </div>
                    <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Fechamento</span>
                        <strong>{new Date(selectedSummary.closedAt).toLocaleString('pt-BR')}</strong>
                    </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.4rem' }}>
                        <span>Inicial:</span>
                        <strong>R$ {Number(selectedSummary.initialValue).toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.4rem' }}>
                        <span>Dinheiro:</span>
                        <strong>R$ {Number(selectedSummary.totals?.Dinheiro || 0).toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.4rem' }}>
                        <span>Pix:</span>
                        <strong>R$ {Number(selectedSummary.totals?.Pix || 0).toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.4rem' }}>
                        <span>Cartão:</span>
                        <strong>R$ {Number(selectedSummary.totals?.['Cartão'] || 0).toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.4rem', color: '#DC2626' }}>
                        <span>Sangrias:</span>
                        <strong>- R$ {Number(selectedSummary.totalWithdrawals || 0).toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.8rem', color: 'var(--primary-color)', fontSize: '1.1rem' }}>
                        <strong>Saldo Final:</strong>
                        <strong>R$ {Number(selectedSummary.expectedCashBal || 0).toFixed(2)}</strong>
                    </div>
                </div>

                <div>
                    <h4 style={{ margin: '0 0 0.8rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Status de Vendas</h4>
                    <div style={{ background: '#FFF8F3', padding: '1rem', borderRadius: '12px', border: '1px solid #FFE8D6' }}>
                        <div style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Vendido em Pedidos</span>
                            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--secondary-color)', margin: '0.4rem 0' }}>
                                R$ {Number(selectedSummary.totals?.totalSold || 0).toFixed(2)}
                            </div>
                            <span style={{ fontSize: '0.8rem', background: '#FFE8D6', color: 'var(--primary-color)', padding: '2px 10px', borderRadius: '20px', fontWeight: 700 }}>
                                {selectedSummary.ordersCount || 0} Pedidos
                            </span>
                        </div>
                    </div>
                </div>
              </div>

              {selectedSummary.withdrawals?.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ margin: '0 0 0.6rem', fontSize: '0.9rem' }}>Detalhamento de Sangrias</h4>
                    <div style={{ maxHeight: '120px', overflowY: 'auto', background: '#FEF2F2', padding: '0.8rem', borderRadius: '10px' }}>
                        {selectedSummary.withdrawals.map(w => (
                            <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem', borderBottom: '1px solid rgba(220, 38, 38, 0.1)' }}>
                                <span>{w.reason}</span>
                                <strong>R$ {Number(w.value).toFixed(2)}</strong>
                            </div>
                        ))}
                    </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn" style={{ flex: 1, background: '#F1F5F9', color: '#475569' }} onClick={() => setIsSummaryModalOpen(false)}>
                    Fechar
                </button>
                <button className="btn btn-primary" style={{ flex: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }} onClick={() => handleDownloadPDF(selectedSummary)}>
                    <Download size={18} /> Baixar Resumo em PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
