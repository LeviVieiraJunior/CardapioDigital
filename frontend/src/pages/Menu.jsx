/**
 * ============================================================================
 * COMPONENTE: Menu.jsx
 * ============================================================================
 * PADRÃO DE PROJETO: Tela do Cardápio / Menu List
 * O QUE ESSE ARQUIVO FAZ:
 * 1. Puxa todas as categorias e pratos da API na montagem (useEffect).
 * 2. Injeta uma categoria "virtual" (fake) chamada "🔥 Promoções do Dia" no state.
 * 3. O usuário pode alternar entre abas (tabs) da barra lateral de categorias.
 * 4. Ao clicar na categoria "Promoção", a lista renderiza produtos filtrados por `isPromotion`.
 * 5. Caso contrário, renderiza por categoria regular baseada no `categoryId`.
 * 6. Usa o hook `addItemToCart` do Zustand (cartStore) para jogar produtos pro carrinho!
 * ============================================================================
 */
import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { useCartStore } from '../store/cartStore';
import { Plus } from 'lucide-react';
import './Menu.css';

export default function Menu() {
  const [categories, setCategories] = useState([]);
  const [plates, setPlates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  
  const addItemToCart = useCartStore((state) => state.addItem);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [catRes, platesRes] = await Promise.all([
          api.get('/categories'),
          api.get('/plates/availables')
        ]);
        
        const fetchedCats = catRes.data.body || [];
        setCategories([ { _id: 'promo', name: '🔥 Promoções do Dia' }, ...fetchedCats ]);
        setPlates(platesRes.data.body || []);
        
        setActiveCategory('promo');
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredPlates = activeCategory === 'promo'
    ? plates.filter(p => p.isPromotion)
    : plates.filter(plate => plate.categoryId === activeCategory || plate.category === activeCategory);

  if (loading) return <div className="page-content container"><div className="loading-spinner">Carregando cardápio...</div></div>;

  return (
    <div className="page-content animate-fade-in">
      {/* Menu Header */}
      <div className="menu-header">
        <div className="container">
          <h1 className="menu-title">Nosso Cardápio</h1>
          <p className="menu-desc">Escolha as melhores opções e receba em casa.</p>
        </div>
      </div>

      <div className="container menu-container">
        {/* Categories Sidebar/TopNav */}
        <div className="categories-nav">
          {categories.map((cat) => (
            <button
              key={cat._id}
              className={`category-btn ${activeCategory === cat._id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat._id)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Plates Grid */}
        <div className="plates-grid">
          {filteredPlates.length > 0 ? (
            filteredPlates.map((plate, index) => (
              <div key={plate._id} className="plate-card animate-pop-in" style={{ opacity: 0, animationDelay: `${index * 0.08}s` }}>
                <div className="plate-img-wrapper" style={{ position: 'relative' }}>
                  <img src={plate.image || 'https://via.placeholder.com/300x200?text=Sem+Foto'} alt={plate.name} className="plate-img" />
                  {plate.isPromotion && (
                    <span style={{ position: 'absolute', top: 10, right: 10, background: '#E74C3C', color: "white", padding: '3px 10px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 900 }}>
                      {plate.promoText || 'PROMOÇÃO'}
                    </span>
                  )}
                </div>
                <div className="plate-info">
                  <h3 className="plate-name">{plate.name}</h3>
                  <p className="plate-description">{plate.description}</p>
                  <div className="plate-footer">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {plate.originalPrice && (
                        <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plate.originalPrice)}
                        </span>
                      )}
                      <span className="plate-price">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plate.price)}
                      </span>
                    </div>
                    <button 
                      className="btn-add-cart"
                      onClick={() => addItemToCart(plate)}
                      aria-label="Adicionar ao carrinho"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-category">Nenhum produto cadastrado nesta categoria.</div>
          )}
        </div>
      </div>
    </div>
  );
}
