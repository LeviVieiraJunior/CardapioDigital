/**
 * ============================================================================
 * COMPONENTE: Login.jsx
 * ============================================================================
 * - Login e Cadastro na mesma tela com toggle animado
 * - Confirmação de senha + botão "olho" para visualizar
 * - Validação: mín. 6 chars, 1 número, 1 caractere especial
 * - Consentimento LGPD com link para Termos de Uso
 * ============================================================================
 */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import api from '../lib/api';
import { UtensilsCrossed, Eye, EyeOff } from 'lucide-react';
import './Login.css';

const passwordRules = (pwd) => ({
  length: pwd.length >= 6,
  number: /\d/.test(pwd),
  special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd),
});

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    lgpdConsent: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const login = useAuthStore((state) => state.login);
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const rules = passwordRules(formData.password);
  const allRulesOk = rules.length && rules.number && rules.special;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isLogin) {
      if (!allRulesOk) {
        setError('A senha deve ter no mínimo 6 caracteres, 1 número e 1 caractere especial.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('As senhas não coincidem. Por favor, verifique.');
        return;
      }
      if (!formData.lgpdConsent) {
        setError('Você deve aceitar os Termos de Uso e a Política de Privacidade.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        const response = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password
        });
        login(response.data.body.user, response.data.body.token);
        addToast('Bem-vindo de volta! 👋', 'success');
        navigate('/');
      } else {
        const response = await api.post('/auth/signup', {
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          lgpdConsent: formData.lgpdConsent
        });
        login(response.data.user, response.data.token);
        addToast(`Conta criada com sucesso, bem-vindo(a) ${formData.fullName}! 🎉`, 'success');
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.body?.text || 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setIsForgotPassword(false);
    setError('');
    setFormData({ fullName: '', email: '', password: '', confirmPassword: '', lgpdConsent: false });
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      setError('Por favor, informe um e-mail válido.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail });
      addToast(res.data.body?.text || 'Se o e-mail existir, você receberá um link.', 'success');
      setIsForgotPassword(false);
      setForgotEmail('');
    } catch (err) {
      addToast(err.response?.data?.text || 'Erro ao solicitar nova senha.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page page-content">
      <div className="auth-container animate-fade-in">
        <div className="auth-header">
          <div className="auth-logo">
            <UtensilsCrossed size={26} color="white" />
          </div>
          <h1 className="auth-title">
            {isForgotPassword ? 'Recuperar Senha' : (isLogin ? 'Bem-vindo de volta' : 'Crie sua conta')}
          </h1>
          <p className="auth-subtitle">
            {isForgotPassword 
              ? 'Enviaremos um link para redefinir sua senha' 
              : (isLogin ? 'Faça login para continuar seu pedido' : 'Cadastre-se para aproveitar nossos pratos')}
          </p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {isForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="auth-form">
            <div className="input-group">
              <label htmlFor="forgotEmail">E-mail cadastrado</label>
              <input
                type="email"
                id="forgotEmail"
                name="forgotEmail"
                className="input-field"
                placeholder="seu@email.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? 'Enviando...' : 'Enviar Link'}
            </button>
            <div className="auth-footer" style={{ marginTop: '1rem' }}>
              <p>
                Lembrou a senha?{' '}
                <button type="button" className="btn-switch" onClick={() => setIsForgotPassword(false)}>
                  Voltar ao Login
                </button>
              </p>
            </div>
          </form>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="auth-form">
            {/* Nome Completo (apenas no cadastro) */}
          {!isLogin && (
            <div className="input-group">
              <label htmlFor="fullName">Nome Completo</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                className="input-field"
                placeholder="Seu nome completo"
                value={formData.fullName}
                onChange={handleInputChange}
                required={!isLogin}
              />
            </div>
          )}

          {/* E-mail */}
          <div className="input-group">
            <label htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              name="email"
              className="input-field"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Senha */}
          <div className="input-group">
            <label htmlFor="password">Senha</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                className="input-field"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label="Mostrar/ocultar senha"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {isLogin && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.3rem' }}>
                <button 
                  type="button" 
                  className="btn-switch" 
                  style={{ fontSize: '0.85rem' }}
                  onClick={() => { setError(''); setIsForgotPassword(true); }}
                >
                  Esqueci minha senha
                </button>
              </div>
            )}
          </div>

          {/* Indicadores de força da senha (apenas no cadastro) */}
          {!isLogin && formData.password.length > 0 && (
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

          {/* Confirmar Senha (apenas no cadastro) */}
          {!isLogin && (
            <div className="input-group">
              <label htmlFor="confirmPassword">Confirmar Senha</label>
              <div className="password-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  className="input-field"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required={!isLogin}
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  aria-label="Mostrar/ocultar confirmação de senha"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {/* Feedback visual de confirmação */}
              {formData.confirmPassword.length > 0 && (
                <p className={formData.password === formData.confirmPassword ? 'rule-ok' : 'rule-fail'} style={{ marginTop: '6px', fontSize: '0.82rem' }}>
                  {formData.password === formData.confirmPassword ? '✔ Senhas coincidem' : '✖ Senhas não coincidem'}
                </p>
              )}
            </div>
          )}

          {/* LGPD + Termos de Uso */}
          {!isLogin && (
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="lgpdConsent"
                name="lgpdConsent"
                checked={formData.lgpdConsent}
                onChange={handleInputChange}
              />
              <label htmlFor="lgpdConsent">
                Eu li e concordo com os{' '}
                <Link to="/termos" target="_blank" className="link-termos">
                  Termos de Uso e Política de Privacidade
                </Link>
                {' '}(LGPD — Lei nº 13.709/2018).
              </label>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isLogin ? 'Ainda não tem uma conta?' : 'Já possui uma conta?'}
            <button className="btn-switch" onClick={switchMode}>
              {isLogin ? 'Cadastre-se' : 'Faça Login'}
            </button>
          </p>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
