import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import api from '../lib/api';
import { ShoppingCart, User, Menu as MenuIcon, X, UtensilsCrossed } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(null); // null = carregando
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();
  const cartCount = useCartStore((state) => state.getCartCount());

  useEffect(() => {
    // A Navbar não checa mais o /active. Somente o checkout fará isso.
  }, [location.pathname]);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const navLinks = [
    { name: 'Início', path: '/' },
    { name: 'Cardápio', path: '/menu' },
  ];

  if (isAuthenticated) {
    navLinks.push({ name: 'Meus Pedidos', path: '/orders' });
  }

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container container">
        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          <div className="logo-icon-wrapper">
            <UtensilsCrossed size={22} color="white" />
          </div>
          <span className="logo-text">Meu<span>Cardápio</span></span>
        </Link>


        {/* Desktop Navigation */}
        <div className="navbar-links desktop-only">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
            >
              {link.name}
            </Link>
          ))}
          {user?.isAdmin && (
            <Link
              to="/admin"
              className={`nav-link admin-link ${isActive('/admin') ? 'active' : ''}`}
            >
              Painel Admin
            </Link>
          )}
        </div>

        {/* Icons and Mobile Toggle */}
        <div className="navbar-actions">
          <Link to="/cart" className="action-icon cart-icon" onClick={closeMenu}>
            <ShoppingCart size={24} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>
          
          {isAuthenticated && (
            <div className="navbar-welcome desktop-only">
              Olá, <span>{(user?.name || 'Cliente').split(' ')[0]}</span>!
            </div>
          )}
          
          <Link to={isAuthenticated ? "/profile" : "/login"} className="action-icon" onClick={closeMenu}>
            <User size={24} />
          </Link>

          <button className="mobile-toggle" onClick={toggleMenu} aria-label="Toggle menu">
            {isOpen ? <X size={28} /> : <MenuIcon size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div className={`mobile-menu ${isOpen ? 'active' : ''}`}>
        <div className="mobile-menu-links">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`mobile-link ${isActive(link.path) ? 'active' : ''}`}
              onClick={closeMenu}
            >
              {link.name}
            </Link>
          ))}
          {isAuthenticated ? (
            <Link to="/profile" className="mobile-link" onClick={closeMenu}>Perfil do Usuário</Link>
          ) : (
            <Link to="/login" className="mobile-link" onClick={closeMenu}>Entrar / Cadastrar</Link>
          )}
          
          {user?.isAdmin && (
            <Link to="/admin" className="mobile-link admin-link" onClick={closeMenu}>
              Painel Admin
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
