import React, { useState, useEffect } from 'react';
import { Trophy, Search, RefreshCw, Award, Users, GraduationCap, Presentation, RotateCcw, Radio } from 'lucide-react';
import { subscribeToTopScores } from '../firebase';

export default function RankingBoard({ currentUserScoreId, onRestart }) {
  const [scores, setScores]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [searchTerm, setSearchTerm]   = useState('');
  const [activeTab, setActiveTab]     = useState('geral');
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    setLoading(true);

    // Inicia listener em tempo real — atualiza automaticamente para todos os dispositivos
    const unsubscribe = subscribeToTopScores((data) => {
      setScores(data);
      setLoading(false);
      setLastUpdated(new Date());
    });

    // Cancela o listener quando o componente for desmontado
    return () => unsubscribe();
  }, []);

  const fmtTime = (s) => {
    if (isNaN(s) || s == null) return '--:--';
    return `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(Math.floor(s % 60)).padStart(2,'0')}`;
  };

  const fmtLastUpdated = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // ─── Calcula a posição global ANTES de filtrar por aba ───────────────────────
  // Isso garante que o "3º geral" continue mostrando posição 3 mesmo na aba Alunos
  const scoresWithGlobalRank = scores.map((r, i) => ({ ...r, globalRank: i + 1 }));

  // ─── Filtra por aba e por busca ──────────────────────────────────────────────
  const filtered = scoresWithGlobalRank.filter(r => {
    if (activeTab === 'aluno'     && r.role !== 'aluno')     return false;
    if (activeTab === 'professor' && r.role !== 'professor') return false;
    const q = searchTerm.toLowerCase();
    return (r.name?.toLowerCase().includes(q) || r.class?.toLowerCase().includes(q));
  });

  const badge = (rank) => {
    if (rank === 1) return <span className="rank-badge rank-gold"   title="1º">1</span>;
    if (rank === 2) return <span className="rank-badge rank-silver" title="2º">2</span>;
    if (rank === 3) return <span className="rank-badge rank-bronze" title="3º">3</span>;
    return <span className="rank-badge rank-default">{rank}</span>;
  };

  return (
    <div className="glass-card wide">

      {/* Header */}
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-tag">
            <Trophy size={14} /> Ranking Global
          </div>
        </div>

        {/* Indicador ao vivo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-secondary)',
        }}>
          <Radio size={13} style={{ color: '#22c55e' }} />
          <span style={{ color: '#22c55e', fontWeight: 600 }}>Ao vivo</span>
          {lastUpdated && (
            <span style={{ opacity: 0.6 }}>· {fmtLastUpdated(lastUpdated)}</span>
          )}
        </div>
      </div>

      <h1 className="page-title" style={{ fontSize: '1.75rem' }}>Quadro de Líderes</h1>
      <p className="page-subtitle" style={{ marginBottom: '1.75rem' }}>
        Os 500 melhores resultados da Feira de Ciências, ordenados por pontuação e tempo.
        Atualiza em tempo real para todos os dispositivos.
      </p>

      {/* Search */}
      <div className="search-wrap">
        <Search className="search-icon" size={16} />
        <input
          type="text"
          className="input-control"
          placeholder="Buscar por nome ou turma…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          id="rank-search"
        />
      </div>

      {/* Tabs */}
      <div className="ranking-tabs">
        {[
          { key: 'geral',     label: 'Geral',       icon: <Users size={13}/> },
          { key: 'aluno',     label: 'Alunos',      icon: <GraduationCap size={13}/> },
          { key: 'professor', label: 'Professores',  icon: <Presentation size={13}/> },
        ].map(t => (
          <button
            key={t.key}
            className={`ranking-tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="empty-state" style={{ minHeight: 220 }}>
          <RefreshCw size={34} className="spin-anim" />
          <p>Carregando ranking…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state" style={{ minHeight: 220 }}>
          <Award size={34} />
          <p>Nenhum resultado encontrado.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="rank-table">
            <thead>
              <tr>
                <th style={{ width: 64 }}>Pos.</th>
                <th>Nome</th>
                <th>Turma / Função</th>
                <th style={{ width: 110, textAlign: 'center' }}>Pontos</th>
                <th style={{ width: 100, textAlign: 'center' }}>Tempo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                // Usa o ID real do Firestore para marcar o jogador atual
                const isCurrent = currentUserScoreId && r.id === currentUserScoreId;
                return (
                  <tr key={r.id} className={isCurrent ? 'current-user-row' : ''}>
                    {/* Posição global — igual em todas as abas */}
                    <td>{badge(r.globalRank)}</td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                        <span style={{ fontWeight: isCurrent ? 700 : 500, color: 'var(--text-primary)' }}>
                          {r.name}
                        </span>
                        {isCurrent && (
                          <span style={{
                            background:'var(--brand)', color:'var(--text-inverse)',
                            fontSize:'0.65rem', fontWeight:800, padding:'2px 6px',
                            borderRadius:'100px', letterSpacing:'0.05em'
                          }}>
                            VOCÊ
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {r.role === 'professor'
                        ? <span style={{ color:'var(--accent)', fontSize:'0.8rem', fontWeight:600 }}>👨‍🏫 Professor</span>
                        : <span>{r.class || '—'}</span>
                      }
                    </td>
                    <td style={{ textAlign:'center', fontWeight:700, color:'var(--text-primary)' }}>
                      {r.score} / 10
                    </td>
                    <td style={{ textAlign:'center', color:'var(--text-muted)', fontFamily:'var(--font-secondary)' }}>
                      {fmtTime(r.timeTaken)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <button className="btn btn-primary" onClick={onRestart} id="btn-rank-restart">
        <RotateCcw size={16} /> Jogar Novamente
      </button>

      <div className="footer-note">
        🔴 Ranking ao vivo via Firebase • Top 500 jogadores • O mesmo ranking em todos os dispositivos
      </div>
    </div>
  );
}
