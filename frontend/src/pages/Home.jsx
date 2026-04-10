/**
 * ============================================================================
 * COMPONENTE: Home.jsx
 * ============================================================================
 * PADRÃO DE PROJETO: Tela Inicial (Landing Page)
 * O QUE ESSE ARQUIVO FAZ:
 * 1. Exibe o "Hero Section" (banner principal) chamando a atenção do cliente.
 * 2. Faz uma requisição GET (/plates/availables) na API.
 * 3. Filtra apenas os pratos que têm a flag booleana `isPromotion` como verdadeira.
 * 4. Exibe na seção "Promoções do Dia" os produtos que o Administrador ativou lá no painel.
 * 5. Permite adicionar o item diretamente ao carrinho utilizando a store global (cartStore).
 * ============================================================================
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShoppingCart, Star, Clock, MapPin } from 'lucide-react';
import api from '../lib/api';
import { useCartStore } from '../store/cartStore';
import { useToastStore } from '../store/toastStore';
import './Home.css';

export default function Home() {
  const [bestsellers, setBestsellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBestsellers = async () => {
      try {
        const res = await api.get('/plates/availables');
        const plates = res.data.body || [];
        const filtered = plates.filter(p => p.isPromotion === true);
        setBestsellers(filtered.slice(0, 4));
      } catch (e) {
        console.error("Erro ao buscar mais pedidos", e);
      } finally {
        setLoading(false);
      }
    };
    fetchBestsellers();
  }, []);

  const handleAddToCart = (plate) => {
    addItem({ ...plate, quantity: 1 });
    addToast(`🔥 ${plate.name} adicionado ao carrinho!`, 'success');
  };

  return (
    <div className="page-content animate-fade-in">

      {/* ── Hero Section ── */}
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-content">
            <span className="hero-badge">🔥 Promoções do Dia</span>
            <h1 className="hero-title">
              A melhor comida da cidade, direto para você.
            </h1>
            <p className="hero-subtitle">
              Faça seu pedido online com rapidez e facilidade — e acompanhe em tempo real.
            </p>
            <div className="hero-actions">
              <Link to="/menu" className="btn btn-lg btn-hero">
                Ver Cardápio <ArrowRight size={20} />
              </Link>
            </div>
            <div className="hero-stats animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <div className="stat-chip">
                <Star size={20} fill="#FFE66D" color="#FFE66D" />
                4.9 <span>Estrelas</span>
              </div>
              <div className="stat-chip">
                <Clock size={20} />
                30–45 <span>Minutos</span>
              </div>
              <div className="stat-chip">
                <MapPin size={20} />
                Local <span>Entrega</span>
              </div>
            </div>
          </div>
          <div className="hero-image-wrapper">
            <div className="hero-image-blob" />
            <img
              src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
              alt="Deliciosa pizza artesanal"
              className="hero-image"
            />
          </div>
        </div>
      </section>

      {/* ── Promoções Section ── */}
      <section className="recommended-section container">
        <div className="section-header">
          <span className="section-eyebrow">Preço Baixo</span>
          <h2 className="section-title">Promoções do Dia</h2>
          <p className="section-desc">Aproveite nossos pratos deliciosos com descontos imperdíveis.</p>
        </div>

        {loading ? (
          <div className="empty-state">Carregando as delícias...</div>
        ) : bestsellers.length === 0 ? (
          <div className="empty-state">
            <Star color="var(--primary-color)" size={40} style={{ margin: '0 auto 15px' }} />
            <p style={{ fontWeight: 700, marginBottom: 6 }}>Nenhuma promoção ativa no momento.</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              O Administrador pode criar promoções marcando "Ativar na Tela Incial" no painel Admin.
            </p>
          </div>
        ) : (
          <div className="recommended-grid">
            {bestsellers.map((plate, index) => (
              <div key={plate._id} className="plate-home-card animate-slide-up" style={{ opacity: 0, animationDelay: `${index * 0.15}s` }}>
                <div className="plate-home-img-wrap">
                  {plate.image ? (
                    <img src={plate.image} alt={plate.name} className="plate-home-img" />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      Sem imagem
                    </div>
                  )}
                  <span className="plate-home-badge" style={{ background: '#E74C3C' }}>{plate.promoText || 'PROMOÇÃO'}</span>
                </div>
                <div className="plate-home-info">
                  <h3 className="plate-home-name">{plate.name}</h3>
                  <p className="plate-home-desc">{plate.description}</p>
                  <div className="plate-home-footer">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {plate.originalPrice && (
                        <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          R$ {Number(plate.originalPrice).toFixed(2)}
                        </span>
                      )}
                      <span className="plate-home-price">
                        R$ {Number(plate.price).toFixed(2)}
                      </span>
                    </div>
                    <button onClick={() => handleAddToCart(plate)} className="btn-plate-add">
                      <ShoppingCart size={16} /> Pedir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── CTA Banner ── */}
      <section className="cta-section">
        <div className="container cta-inner">
          <div className="cta-text">
            <h2>Conheça todo o nosso cardápio</h2>
            <p>Diversas opções de pratos, lanches e bebidas esperando por você.</p>
          </div>
          <Link to="/menu" className="btn btn-primary btn-lg">
            Ir para o Cardápio <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
}
