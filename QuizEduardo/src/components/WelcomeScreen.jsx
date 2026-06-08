import React from 'react';
import { GraduationCap, Presentation, ArrowRight, Leaf } from 'lucide-react';

export default function WelcomeScreen({ role, setRole, onNext }) {
  return (
    <div className="glass-card">

      {/* App Logo/Brand */}
      <div className="app-logo-badge">
        <div className="logo-icon-wrap">
          <Leaf size={28} strokeWidth={2} />
        </div>
        <div className="logo-text-block">
          <span className="logo-name">Quiz IA & Sustentabilidade</span>
          <span className="logo-sub">Feira de Ciências • Quiz Interativo</span>
        </div>
      </div>

      <h1 className="page-title">Bem-vindo ao Quiz!</h1>
      <p className="page-subtitle">
        Descubra como a Inteligência Artificial está sendo usada para proteger
        florestas, conservar rios, gerenciar resíduos e apoiar cidades sustentáveis.
      </p>

      {/* Divider */}
      <div className="section-divider">Selecione seu perfil</div>

      {/* Role selection */}
      <div className="role-grid">
        <div
          className={`role-card ${role === 'aluno' ? 'selected' : ''}`}
          onClick={() => setRole('aluno')}
          id="role-aluno"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setRole('aluno')}
        >
          <div className="role-icon-wrap">
            <GraduationCap size={26} strokeWidth={2} />
          </div>
          <span>Aluno</span>
          <p className="role-card-desc">
            Registra nome e turma. Sua pontuação entra no ranking global.
          </p>
        </div>

        <div
          className={`role-card ${role === 'professor' ? 'selected' : ''}`}
          onClick={() => setRole('professor')}
          id="role-professor"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setRole('professor')}
        >
          <div className="role-icon-wrap">
            <Presentation size={26} strokeWidth={2} />
          </div>
          <span>Professor</span>
          <p className="role-card-desc">
            Apenas o nome é necessário. Acesso completo ao quiz sem turma.
          </p>
        </div>
      </div>

      <button
        className="btn btn-primary"
        onClick={onNext}
        disabled={!role}
        id="btn-welcome-next"
      >
        Avançar para Identificação <ArrowRight size={16} />
      </button>

      <div className="footer-note">
        10 questões sobre IA e Meio Ambiente • Ranking com os 500 melhores
      </div>
    </div>
  );
}
