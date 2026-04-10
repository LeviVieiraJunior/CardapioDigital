/**
 * ============================================================================
 * COMPONENTE: Profile.jsx
 * ============================================================================
 * PADRÃO DE PROJETO: Perfil do Usuário / Meus Pedidos
 * O QUE ESSE ARQUIVO FAZ:
 * 1. Exibe os dados básicos do usuário logado (E-mail).
 * 2. `fetchOrders`: Busca todos os pedidos da API e filtra apenas os que
 *    pertencem ao ID do usuário atual.
 * 3. Mostra o status atual do pedido (Recebido, Preparo, etc.) com cores dinâmicas.
 * 4. GESTÃO DE DADOS (LGPD): Permite que o usuário EXCLUA sua própria conta
 *    e dados do banco de dados clicando em 'Excluir minha conta'.
 * ============================================================================
 */
import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { LogOut, AlertTriangle, Save, Eye, EyeOff } from 'lucide-react';
import { useToastStore } from '../store/toastStore';
import './Profile.css';

export default function Profile() {
  const { user, logout, login } = useAuthStore();
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    password: '',
    confirmPassword: '',
    verificationCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleDeleteData = async () => {
    if (window.confirm('Atenção (LGPD): Você tem certeza que deseja excluir sua conta e remover seus dados de nossa base? Essa ação é irreversível.')) {
      try {
        await api.delete(`/users/${user.id || user._id}`);
        addToast('Conta excluída com sucesso.', 'success');
        logout();
        navigate('/');
      } catch (error) {
        addToast('Erro ao excluir a conta.', 'error');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (formData.password.trim() !== '') {
        const pwdRules = /^(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{6,}$/;
        if (!pwdRules.test(formData.password)) {
          addToast('Senha fraca: use mín. 6 caracteres, 1 número e 1 especial.', 'warning');
          setLoading(false);
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          addToast('As senhas não coincidem.', 'error');
          setLoading(false);
          return;
        }

        // Se tem senha, e ainda não estamos na tela de verificar, dispara o email
        if (!isVerifying) {
          try {
            await api.post(`/users/${user.id || user._id}/send-code`);
            setIsVerifying(true);
            addToast('Código enviado! Verifique seu e-mail.', 'info');
          } catch (err) {
            addToast('Erro ao enviar código. Tente novamente.', 'error');
          } finally {
            setLoading(false);
          }
          return; // Para aqui e aguarda o código
        }
      }

      // Prepara os dados para salvar
      const updatePayload = { name: formData.name };
      if (formData.password.trim() !== '') {
        updatePayload.password = formData.password;
        updatePayload.verificationCode = formData.verificationCode;
      }

      const response = await api.put(`/users/${user.id || user._id}`, updatePayload);
      
      // Atualiza a store global com os novos dados
      if (response.data.body) {
        login(response.data.body, useAuthStore.getState().token);
      }

      addToast('Perfil atualizado com sucesso!', 'success');
      if (updatePayload.password) {
        addToast('Faça login novamente com a nova senha.', 'info', 4000);
        setTimeout(() => { logout(); navigate('/login'); }, 1500);
      }
    } catch (error) {
      if (error.response?.data?.body?.text) {
        addToast(error.response.data.body.text, 'error');
      } else {
        addToast('Erro ao atualizar. Tente novamente.', 'error');
      }
      console.error('Erro ao atualizar perfil', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content container profile-page animate-fade-in">
      <div className="profile-layout">
        <aside className="profile-sidebar">
          <div className="profile-card">
            <div className="profile-avatar">
              {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
            </div>
            <h2 className="profile-name">{user?.name || 'Cliente'}</h2>
            <p className="profile-email">{user?.email}</p>
            <p className="profile-role">{user?.isAdmin ? '🛡️ Administrador' : '👤 Cliente'}</p>
            
            <button className="btn btn-outline-danger btn-full logout-btn" onClick={handleLogout}>
              <LogOut size={18} /> Sair da conta
            </button>
          </div>

          <div className="lgpd-card">
            <div className="lgpd-header">
              <AlertTriangle size={20} color="var(--danger-color)" />
              <h3>Privacidade de Dados</h3>
            </div>
            <p>Conforme a LGPD, você pode gerenciar seus dados ou excluir sua conta.</p>
            <button className="btn-text-danger" onClick={handleDeleteData}>
              Excluir minha conta
            </button>
          </div>
        </aside>

        <main className="profile-content">
          <h2 className="section-title">Meus Dados</h2>
          <form className="profile-form" onSubmit={handleSubmit} style={{ backgroundColor: "white", padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <div className="input-group">
              <label>Seu Nome Completo</label>
              <input
                type="text" className="input-field" placeholder="Ex: Felipe Vieira"
                value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="input-group" style={{ marginTop: '1.5rem' }}>
              <label>Nova Senha (opcional)</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  placeholder="Deixe em branco para não alterar"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                  {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
            </div>

            {formData.password.length > 0 && (
              <div className="input-group">
                <label>Confirmar Nova Senha</label>
                <input
                  type="password" className="input-field"
                  placeholder="Repita a nova senha"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  disabled={isVerifying}
                />
                {formData.confirmPassword.length > 0 && (
                  <p style={{ marginTop: '4px', fontSize: '0.82rem', fontWeight: 700, color: formData.password === formData.confirmPassword ? '#2ECC71' : '#E74C3C' }}>
                    {formData.password === formData.confirmPassword ? '✔ Senhas coincidem' : '✖ Senhas não coincidem'}
                  </p>
                )}
              </div>
            )}

            {isVerifying && (
              <div className="input-group animate-fade-in" style={{ marginTop: '1.5rem', borderLeft: '4px solid var(--primary-color)', paddingLeft: '1rem' }}>
                <label style={{ color: 'var(--primary-color)' }}>Código de Verificação Recibido por E-mail</label>
                <input
                  type="text" className="input-field"
                  placeholder="Digite o código de 6 dígitos"
                  value={formData.verificationCode}
                  onChange={(e) => setFormData({...formData, verificationCode: e.target.value})}
                />
                <p style={{ marginTop: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Enviamos um código para seu e-mail. Verifique o console backend (Ethereal Mock) no modo de desenvolvimento.
                </p>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ marginTop: '1.5rem' }} disabled={loading}>
              <Save size={18} /> {loading ? 'Processando...' : (isVerifying ? 'Confirmar Segurança e Salvar' : 'Salvar Alterações')}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}
