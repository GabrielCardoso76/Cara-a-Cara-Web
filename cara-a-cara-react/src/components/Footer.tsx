import React from 'react';
import './Footer.css'; // Estilos para o Footer

// Ícone do GitHub como um componente SVG simples
const GitHubIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
  </svg>
);

// Ícone de Email
const EmailIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
);

// Ícone de Telefone
const PhoneIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
);


const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3 className="footer-title">Cara a Cara Web</h3>
          <p>Versão digital do famoso jogo físico.</p>
          <p>Desenvolvido por alunos do SENAI (Projeto Original) e adaptado para React.</p>
          <div className="social-links">
            <a href="https://github.com/GabrielCardoso76/Cara-a-Cara-Web" target="_blank" rel="noopener noreferrer" className="social-icon">
              <GitHubIcon /> GitHub do Projeto Original
            </a>
            {/* Adicionar link para o novo repositório React se houver */}
          </div>
        </div>

        <div className="footer-section">
          <h3 className="footer-title">Desenvolvedores</h3>
          <ul className="dev-list">
            <li>Gabriel Cardoso Torres (Projeto Original)</li>
            <li>Jules (Assistente AI para migração React)</li>
            {/* Adicionar seu nome se estiver trabalhando nisso */}
          </ul>
          <div className="contact-info">
            <p>
              <EmailIcon /> torresgbriel8@gmail.com (Contato Original)
            </p>
            <p>
              <PhoneIcon /> (16) 99346-3038 (Contato Original)
            </p>
          </div>
        </div>

        <div className="footer-section">
          <h3 className="footer-title">Tecnologias</h3>
          <div className="tech-badges">
            <span className="tech-badge">HTML5 (Original)</span>
            <span className="tech-badge">CSS3 (Original & Adaptado)</span>
            <span className="tech-badge">JavaScript (Original)</span>
            <span className="tech-badge">React</span>
            <span className="tech-badge">TypeScript</span>
            <span className="tech-badge">Firebase</span>
            <span className="tech-badge">GitHub Pages (Original)</span>
          </div>
          <p className="copyright">© {new Date().getFullYear()} Cara a Cara Web (React Version). Direitos baseados no projeto original.</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>Projeto original desenvolvido como parte do Curso Técnico em Desenvolvimento de Sistemas - SENAI</p>
      </div>
    </footer>
  );
};

export default Footer;
