import React, { useState } from 'react';
import { ArrowLeft, Play, AlertCircle, User, BookOpen } from 'lucide-react';

export default function LoginScreen({ role, onBack, onLogin, onAdminTrigger }) {
  const [name, setName]           = useState('');
  const [userClass, setUserClass] = useState('');
  const [error, setError]         = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const trimName  = name.trim();
    const trimClass = userClass.trim();

    if (!trimName) {
      setError('Por favor, insira seu nome completo.');
      return;
    }
    if (trimName.length < 2) {
      setError('O nome deve ter ao menos 2 caracteres.');
      return;
    }
    if (role === 'aluno') {
      if (!trimClass) {
        setError('Por favor, insira sua turma.');
        return;
      }
      if (trimClass === '12345678') {
        onAdminTrigger();
        return;
      }
    }

    onLogin({ name: trimName, class: role === 'aluno' ? trimClass : '', role });
  };

  return (
    <div className="glass-card">

      {/* Header */}
      <div className="card-header">
        <div className="card-header-left">
          <div className={`card-tag`}>
            {role === 'aluno' ? '🎓 Aluno' : '👨‍🏫 Professor'}
          </div>
        </div>
        <button
          className="btn-icon"
          onClick={onBack}
          title="Voltar à seleção de perfil"
          id="btn-login-back"
        >
          <ArrowLeft size={16} />
        </button>
      </div>

      <h1 className="page-title" style={{ fontSize: '1.75rem' }}>
        Identificação
      </h1>
      <p className="page-subtitle" style={{ textAlign: 'left', marginBottom: '2rem' }}>
        {role === 'aluno'
          ? 'Informe seu nome e turma para que sua pontuação seja registrada no ranking global da feira.'
          : 'Informe seu nome para acessar o quiz como professor.'}
      </p>

      <form onSubmit={handleSubmit} id="login-form" noValidate>

        {/* Name field */}
        <div className="form-group">
          <label className="form-label" htmlFor="user-name">
            <User size={12} style={{ display:'inline', marginRight:'4px' }} />
            Nome Completo
          </label>
          <input
            type="text"
            id="user-name"
            className="input-control"
            placeholder="Ex: Ana Paula Souza"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
            autoComplete="name"
          />
        </div>

        {/* Class field (students only) */}
        {role === 'aluno' && (
          <div className="form-group">
            <label className="form-label" htmlFor="user-class">
              <BookOpen size={12} style={{ display:'inline', marginRight:'4px' }} />
              Turma
            </label>
            <input
              type="text"
              id="user-class"
              className="input-control"
              placeholder="Ex: 8º Ano B"
              value={userClass}
              onChange={e => setUserClass(e.target.value)}
              autoComplete="off"
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="shake"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--error)',
              background: 'var(--error-light)',
              border: '1px solid var(--error-border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              fontFamily: 'var(--font-secondary)',
              fontSize: '0.875rem',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onBack}
            id="btn-login-cancel"
          >
            Voltar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            id="btn-login-submit"
          >
            <Play size={15} fill="currentColor" />
            Iniciar Quiz
          </button>
        </div>
      </form>

      <div className="footer-note">
        {role === 'aluno'
          ? 'Sua pontuação será salva automaticamente no ranking global.'
          : 'Modo Professor: sem registro de turma no ranking.'}
      </div>
    </div>
  );
}
