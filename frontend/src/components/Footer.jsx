import React from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, MapPin, Phone, Clock, Star, Heart } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer">
      <div className="footer-main container">

        {/* Coluna 1 - Logo e Sobre */}
        <div className="footer-col footer-brand">
          <div className="footer-logo">
            <UtensilsCrossed size={22} color="white" />
          </div>
          <h3>Sabor da Casa</h3>
          <p>
            Comida caseira feita com amor e cuidado.
            Ingredientes frescos, receitas tradicionais
            e entrega rápida na sua porta.
          </p>
          <div className="footer-stars">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} fill="#FBBC04" color="#FBBC04" />
            ))}
            <span>Avaliado no Google</span>
          </div>
        </div>

        {/* Coluna 2 - Informações */}
        <div className="footer-col">
          <h4>Informações</h4>
          <ul className="footer-links">
            <li><Link to="/" onClick={handleScrollToTop}>Início</Link></li>
            <li><Link to="/menu" onClick={handleScrollToTop}>Cardápio</Link></li>
            <li><Link to="/termos" onClick={handleScrollToTop}>Termos de Uso</Link></li>
            <li><Link to="/termos" onClick={handleScrollToTop}>Política de Privacidade</Link></li>
            <li><Link to="/termos" onClick={handleScrollToTop}>Sobre a Empresa</Link></li>
          </ul>
        </div>

        {/* Coluna 3 - Contato */}
        <div className="footer-col">
          <h4>Contato</h4>
          <ul className="footer-info-list">
            <li>
              <MapPin size={15} />
              <span>Endereço disponível no estabelecimento</span>
            </li>
            <li>
              <Phone size={15} />
              <span>Contato via WhatsApp ou App</span>
            </li>
            <li>
              <Clock size={15} />
              <span>Seg – Sex: 11h às 22h<br />Sáb – Dom: 11h às 23h</span>
            </li>
          </ul>
        </div>

        {/* Coluna 4 - Avaliações */}
        <div className="footer-col">
          <h4>Nos Avalie!</h4>
          <p className="footer-review-text">
            Gostou do nosso serviço? Sua avaliação honesta no Google nos ajuda a crescer!
          </p>
          <a
            href="https://google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-google-review"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Avaliar no Google
          </a>
        </div>

      </div>

      {/* Rodapé legal */}
      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p>
            © {currentYear} Sabor da Casa. Todos os direitos reservados.
            Operado em conformidade com a{' '}
            <Link to="/termos" onClick={handleScrollToTop}>LGPD (Lei nº 13.709/2018)</Link>
            {' '}e o{' '}
            <Link to="/termos" onClick={handleScrollToTop}>CDC (Lei nº 8.078/1990)</Link>.
          </p>
          <p className="footer-made">
            Desenvolvido por @levi.vieira.junior
          </p>
        </div>
      </div>
    </footer>
  );
}
