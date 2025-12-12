import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-logo">VAPE<span>PARADISE</span></h3>
            <p className="footer-description">
              Лучший выбор vape продукции в Беларуси. 
              Качество гарантировано, доставка по всей стране.
            </p>
            <div className="social-links">
              <a href="#" className="social-link" aria-label="Instagram">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                </svg>
              </a>
              <a href="#" className="social-link" aria-label="Telegram">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.56c-.21 2.22-1.12 7.58-1.58 10.06-.2 1.06-.58 1.41-.95 1.45-.81.07-1.42-.53-2.21-1.04-1.23-.8-1.92-1.3-3.11-2.08-1.37-.89-.48-1.38.3-2.18.21-.22 3.77-3.45 3.83-3.74.01-.04.01-.18-.07-.26s-.21-.05-.3-.03c-.13.04-2.18 1.39-6.16 4.08-.58.4-1.11.59-1.58.58-.52-.01-1.52-.29-2.26-.53-.91-.29-1.63-.44-1.57-.93.03-.25.38-.51 1.04-.78 4.08-1.78 6.8-2.95 8.15-3.52 3.89-1.62 4.69-1.9 5.3-1.91.12 0 .37.03.54.17.14.12.18.28.2.44-.01.06.01.23-.01.36z"/>
                </svg>
              </a>
              <a href="#" className="social-link" aria-label="VK">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5.5 10.5c0 .3-.1.6-.3.8l-1.5 1.5c-.2.2-.5.3-.8.3h-7c-.3 0-.6-.1-.8-.3l-1.5-1.5c-.2-.2-.3-.5-.3-.8v-3c0-.3.1-.6.3-.8l1.5-1.5c.2-.2.5-.3.8-.3h7c.3 0 .6.1.8.3l1.5 1.5c.2.2.3.5.3.8v3z"/>
                </svg>
              </a>
            </div>
          </div>
          
          <div className="footer-section">
            <h4>Навигация</h4>
            <ul className="footer-links">
              <li><a href="/">Главная</a></li>
              <li><a href="/products">Товары</a></li>
              <li><a href="/about">О нас</a></li>
              <li><a href="/contacts">Контакты</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Категории</h4>
            <ul className="footer-links">
              <li><a href="/products?category=liquids">Жидкости</a></li>
              <li><a href="/products?category=devices">Устройства</a></li>
              <li><a href="/products?category=pods">Поды</a></li>
              <li><a href="/products?category=accessories">Аксессуары</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Контакты</h4>
            <div className="contact-info">
              <p className="contact-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
                +375 (29) XXX-XX-XX
              </p>
              <p className="contact-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                info@vapeparadise.by
              </p>
              <p className="contact-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                г. Минск, ул. Интернациональная, 36
              </p>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2024 VAPE PARADISE. Все права защищены.</p>
          <div className="footer-bottom-links">
            <a href="/privacy">Политика конфиденциальности</a>
            <a href="/terms">Условия использования</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
