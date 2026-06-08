import React, { useState, useEffect } from 'react';
import { Shield, Users, Eye, Edit2, Trash2, X, Save, Check, RefreshCw } from 'lucide-react';
import { getTopScores, getAccessCount, updateScoreRecord, deleteScoreRecord } from '../firebase';

export default function AdminPanel({ onClose }) {
  const [scores, setScores]           = useState([]);
  const [accessCount, setAccessCount] = useState(0);
  const [loading, setLoading]         = useState(true);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editName, setEditName]       = useState('');
  const [editClass, setEditClass]     = useState('');
  const [editScore, setEditScore]     = useState(0);
  const [editTime, setEditTime]       = useState(0);
  const [deletingId, setDeletingId]   = useState(null);
  const [toast, setToast]             = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [all, count] = await Promise.all([getTopScores(), getAccessCount()]);
      setScores(all);
      setAccessCount(count);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const openEdit = (r) => {
    setEditingRecord(r);
    setEditName(r.name);
    setEditClass(r.class || '');
    setEditScore(r.score);
    setEditTime(r.timeTaken);
  };

  const saveEdit = async () => {
    if (!editName.trim()) return;
    setLoading(true);
    try {
      await updateScoreRecord(editingRecord.id, {
        name: editName.trim(),
        class: editingRecord.role === 'aluno' ? editClass.trim() : '',
        score: parseInt(editScore, 10),
        timeTaken: parseFloat(editTime),
      });
      showToast('Registro atualizado com sucesso!');
      setEditingRecord(null);
      await load();
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const confirmDelete = async (id) => {
    setLoading(true);
    try {
      await deleteScoreRecord(id);
      showToast('Registro excluído com sucesso!');
      setDeletingId(null);
      await load();
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fmtTime = (s) => {
    if (isNaN(s) || s == null) return '00:00';
    return `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(Math.floor(s % 60)).padStart(2,'0')}`;
  };

  return (
    <div className="glass-card wide">

      {/* Header */}
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-tag danger">
            <Shield size={13} /> Painel Administrativo
          </div>
        </div>
        <button className="btn-icon" onClick={onClose} title="Sair" id="btn-admin-close">
          <X size={16} />
        </button>
      </div>

      <h1 className="page-title" style={{ fontSize: '1.75rem' }}>
        Controle do Administrador
      </h1>
      <p className="page-subtitle" style={{ marginBottom: '2rem' }}>
        Gerencie as estatísticas e os registros de pontuação do ranking global.
      </p>

      {/* Stats */}
      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-icon-wrap blue"><Eye size={20} /></div>
          <div className="stat-info">
            <span className="stat-value">{accessCount}</span>
            <span className="stat-label">Visualizações</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrap"><Users size={20} /></div>
          <div className="stat-info">
            <span className="stat-value">{scores.length}</span>
            <span className="stat-label">Jogadores Salvos</span>
          </div>
        </div>
      </div>

      {/* Sub-header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
        <h3 style={{ fontSize:'1rem', fontWeight:700, color:'var(--text-secondary)' }}>
          Registros de Pontuações
        </h3>
        <button className="btn-icon" onClick={load} disabled={loading} title="Recarregar">
          <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
        </button>
      </div>

      {/* Table */}
      {loading && scores.length === 0 ? (
        <div className="empty-state" style={{ minHeight: 180 }}>
          <RefreshCw size={30} className="spin-anim" /><p>Carregando…</p>
        </div>
      ) : scores.length === 0 ? (
        <div className="empty-state" style={{ minHeight: 180 }}>
          <p>Nenhum jogador registrado ainda.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="rank-table">
            <thead>
              <tr>
                <th style={{ width:52 }}>#</th>
                <th>Nome</th>
                <th>Turma / Função</th>
                <th style={{ width:90, textAlign:'center' }}>Pontos</th>
                <th style={{ width:90, textAlign:'center' }}>Tempo</th>
                <th style={{ width:100, textAlign:'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((r, i) => (
                <tr key={r.id} id={`admin-row-${i}`}>
                  <td style={{ color:'var(--text-muted)', fontWeight:600 }}>{i + 1}</td>
                  <td style={{ fontWeight:600, color:'var(--text-primary)' }}>{r.name}</td>
                  <td>
                    {r.role === 'professor'
                      ? <span style={{ color:'var(--accent)', fontSize:'0.8rem', fontWeight:600 }}>👨‍🏫 Professor</span>
                      : <span style={{ color:'var(--text-secondary)' }}>{r.class || '—'}</span>
                    }
                  </td>
                  <td style={{ textAlign:'center', fontWeight:700 }}>{r.score} / 10</td>
                  <td style={{ textAlign:'center', color:'var(--text-muted)', fontFamily:'var(--font-secondary)' }}>
                    {fmtTime(r.timeTaken)}
                  </td>
                  <td>
                    <div className="admin-actions" style={{ justifyContent:'center' }}>
                      <button
                        className="btn-icon edit-btn"
                        onClick={() => openEdit(r)}
                        title="Editar"
                        id={`btn-edit-${i}`}
                      ><Edit2 size={13} /></button>
                      <button
                        className="btn-icon delete-btn"
                        onClick={() => setDeletingId(r.id)}
                        title="Excluir"
                        id={`btn-delete-${i}`}
                      ><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button className="btn btn-secondary" onClick={onClose} id="btn-admin-bottom-close">
        <X size={15} /> Fechar Painel Admin
      </button>

      {/* ── EDIT MODAL ── */}
      {editingRecord && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 className="modal-title"><Edit2 size={18} /> Editar Registro</h3>

            <div className="form-group">
              <label className="form-label">Nome do Jogador</label>
              <input type="text" className="input-control" value={editName}
                onChange={e => setEditName(e.target.value)} />
            </div>

            {editingRecord.role === 'aluno' && (
              <div className="form-group">
                <label className="form-label">Turma</label>
                <input type="text" className="input-control" value={editClass}
                  onChange={e => setEditClass(e.target.value)} />
              </div>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              <div className="form-group">
                <label className="form-label">Pontos (0–10)</label>
                <input type="number" min={0} max={10} className="input-control"
                  value={editScore} onChange={e => setEditScore(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Tempo (seg.)</label>
                <input type="number" min={0} step="any" className="input-control"
                  value={editTime} onChange={e => setEditTime(e.target.value)} />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setEditingRecord(null)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={saveEdit} id="btn-edit-save">
                <Save size={15} /> Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM MODAL ── */}
      {deletingId && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 420 }}>
            <h3 className="modal-title" style={{ color:'var(--error)' }}>
              <Trash2 size={18} /> Confirmar Exclusão
            </h3>
            <p style={{ color:'var(--text-secondary)', fontFamily:'var(--font-secondary)', fontSize:'0.9rem', lineHeight:1.6 }}>
              Tem certeza que deseja apagar permanentemente este registro do ranking global? Esta ação é irreversível.
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeletingId(null)}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={() => confirmDelete(deletingId)} id="btn-delete-confirm">
                <Trash2 size={15} /> Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div className="toast">
          <Check className="toast-icon" size={18} />
          <span className="toast-text">{toast}</span>
        </div>
      )}
    </div>
  );
}
