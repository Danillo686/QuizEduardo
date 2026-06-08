import React, { useState, useEffect } from 'react';
import { Trophy, Search, RefreshCw, Award, Users, GraduationCap, Presentation, RotateCcw } from 'lucide-react';
import { getTopScores } from '../firebase';

export default function RankingBoard({ currentUserScoreId, onRestart }) {
  const [scores, setScores]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('geral');

  const fetchScores = async () => {
    setLoading(true);
    try {
      setScores(await getTopScores());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchScores(); }, []);

  const fmtTime = (s) => {
    if (isNaN(s) || s == null) return '--:--';
    return `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(Math.floor(s % 60)).padStart(2,'0')}`;
  };

  const filtered = scores.filter(r => {
    if (activeTab === 'aluno'    && r.role !== 'aluno')     return false;
    if (activeTab === 'professor'&& r.role !== 'professor') return false;
    const q = searchTerm.toLowerCase();
    return (r.name?.toLowerCase().includes(q) || r.class?.toLowerCase().includes(q));
  });

  const badge = (i) => {
    const n = i + 1;
    if (n === 1) return <span className="rank-badge rank-gold"  title="1º">1</span>;
    if (n === 2) return <span className="rank-badge rank-silver" title="2º">2</span>;
    if (n === 3) return <span className="rank-badge rank-bronze" title="3º">3</span>;
    return <span className="rank-badge rank-default">{n}</span>;
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
        <button
          className="btn-icon"
          onClick={fetchScores}
          disabled={loading}
          title="Atualizar ranking"
          id="btn-rank-refresh"
        >
          <RefreshCw size={15} className={loading ? 'spin-anim' : ''} />
        </button>
      </div>

      <h1 className="page-title" style={{ fontSize: '1.75rem' }}>Quadro de Líderes</h1>
      <p className="page-subtitle" style={{ marginBottom: '1.75rem' }}>
        Os 500 melhores resultados da Feira de Ciências, ordenados por pontuação e tempo.
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
          { key: 'geral',    label: 'Geral',       icon: <Users size={13}/> },
          { key: 'aluno',    label: 'Alunos',      icon: <GraduationCap size={13}/> },
          { key: 'professor',label: 'Professores',  icon: <Presentation size={13}/> },
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
              {filtered.map((r, i) => {
                const isCurrent = r.id === currentUserScoreId;
                return (
                  <tr key={r.id} className={isCurrent ? 'current-user-row' : ''}>
                    <td>{badge(i)}</td>
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
        Ranking atualizado em tempo real via Firebase • Top 500 jogadores
      </div>
    </div>
  );
}
