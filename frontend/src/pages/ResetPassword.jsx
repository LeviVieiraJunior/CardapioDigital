import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToastStore } from '../store/toastStore';
import api from '../lib/api';
import './Login.css'; // Reutilizando a centralização e estilos da página de Login

const passwordRules = (pwd) => ({
  length: pwd.length >= 6,
  number: /\d/.test(pwd),
  special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd),
});

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const rules = passwordRules(password);
  const allRulesOk = rules.length && rules.number && rules.special;

  if (!token) {
    return (
      <div className="auth-page page-content">
        <div className="auth-container" style={{ textAlign: 'center' }}>
          <h2>Link Inválido</h2>
          <p>O token de redefinição de senha está ausente.</p>
          <button className="btn btn-primary" onClick={() => navigate('/login')} style={{ marginTop: '1rem' }}>
            Voltar para o Login
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allRulesOk) {
      setError('A senha deve ter no mínimo 6 caracteres, 1 número e 1 caractere especial.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/reset-password', { token, newPassword: password });
      addToast(res.data.body?.text || 'Senha alterada com sucesso!', 'success');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.text || 'Ocorreu um erro. O link pode ter expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page page-content">
      <div className="auth-container animate-fade-in">
        <div className="auth-header">
          <h1 className="auth-title">Crie uma nova senha</h1>
          <p className="auth-subtitle">Digite sua nova senha abaixo.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="password">Nova Senha</label>
            <input
              type="password"
              id="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {password.length > 0 && (
            <div className="password-rules">
              <span className={rules.length ? 'rule-ok' : 'rule-fail'}>
                {rules.length ? '✔' : '✖'} Mínimo 6 caracteres
              </span>
              <span className={rules.number ? 'rule-ok' : 'rule-fail'}>
                {rules.number ? '✔' : '✖'} Pelo menos 1 número
              </span>
              <span className={rules.special ? 'rule-ok' : 'rule-fail'}>
                {rules.special ? '✔' : '✖'} 1 caractere especial (!@#$...)
              </span>
            </div>
          )}

          <div className="input-group">
            <label htmlFor="confirmPassword">Confirmar Nova Senha</label>
            <input
              type="password"
              id="confirmPassword"
              className="input-field"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? 'Salvando...' : 'Redefinir Senha'}
          </button>
        </form>
      </div>
    </div>
  );
}
