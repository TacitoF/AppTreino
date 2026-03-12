import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { apiFetch } from '../auth';
import { R } from '../config';
import { IconBack, IconPlus, IconTrash, IconDrag } from '../components/icons';

function TelaGerenciarSplits({ usuario, splits, onSalvar, onVoltar, mostrarToast }) {
  const [lista, setLista] = useState(() =>
    splits.map(s => ({ ...s, nomeHistorico: s.nomeHistorico || s.nome }))
  );
  const [saving, setSaving]     = useState(false);
  const [dragging, setDragging] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

  const dragRef    = useRef({ from: null, to: null });
  const touchRef   = useRef(null);
  const listRef    = useRef(null);

  const adicionar = useCallback(() =>
    setLista(l => [...l, { id:`split_${Date.now()}`, id_usuario:usuario.id, nome:'', nomeHistorico:'', ultimo_treino:null }])
  , [usuario.id]);

  const renomear = useCallback((id, nome) =>
    setLista(l => l.map(s => s.id === id ? {
      ...s,
      nome,
      // nomeHistorico permanece fixo no nome original — usado pelo backend para
      // resolver o nome do split nas séries já gravadas no histórico
    } : s))
  , []);

  const remover = useCallback((id) =>
    setLista(l => l.filter(s => s.id !== id))
  , []);

  const salvar = async () => {
    if (lista.some(s => !s.nome.trim())) { mostrarToast('Preencha o nome de todos os grupos.', 'erro'); return; }
    setSaving(true);
    try {
      await apiFetch(R.splits, { method: 'POST', body: { id_usuario: usuario.id, splits: lista } });
      mostrarToast('Grupos salvos.', 'sucesso');
      onSalvar(lista);
    } catch { mostrarToast('Erro ao salvar.', 'erro'); }
    finally { setSaving(false); }
  };

  const applyReorder = useCallback((from, to) => {
    if (from === null || to === null || from === to) return;
    setLista(l => {
      const next = [...l];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const onDragStart = (i) => { dragRef.current.from = i; setDragging(i); setDropTarget(i); };
  const onDragEnter = (i) => { dragRef.current.to = i; setDropTarget(i); };
  const onDragEnd   = () => {
    applyReorder(dragRef.current.from, dragRef.current.to);
    dragRef.current = { from: null, to: null };
    setDragging(null); setDropTarget(null);
  };

  const onTouchStart = (i, e) => {
    touchRef.current = { idx: i };
    dragRef.current.from = i;
    setDragging(i); setDropTarget(i);
  };
  const onTouchMove = (e) => {
    if (!touchRef.current) return;
    e.preventDefault();
    const y = e.touches[0].clientY;
    const els = listRef.current?.querySelectorAll('[data-item]');
    if (!els) return;
    let target = dragRef.current.from;
    els.forEach((el, j) => {
      const rect = el.getBoundingClientRect();
      if (y >= rect.top && y <= rect.bottom) target = j;
    });
    if (target !== dragRef.current.to) {
      dragRef.current.to = target;
      setDropTarget(target);
    }
  };
  const onTouchEnd = () => {
    if (!touchRef.current) return;
    applyReorder(dragRef.current.from, dragRef.current.to);
    touchRef.current = null;
    dragRef.current  = { from: null, to: null };
    setDragging(null); setDropTarget(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <div className="px-5 pt-14 pb-4 flex items-center gap-4 border-b border-zinc-900">
        <button onClick={onVoltar} className="btn w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:bg-zinc-800"><IconBack/></button>
        <div>
          <h1 className="text-xl font-bold text-white">Grupos Musculares</h1>
          <p className="text-zinc-500 text-xs mt-0.5">Arraste para reordenar</p>
        </div>
      </div>
      <div
        ref={listRef}
        className="px-5 pt-4 flex flex-col gap-3 flex-1 pb-4"
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {lista.map((s, i) => {
          const isDragging = dragging === i;
          const isDropZone = dropTarget === i && dragging !== null && dragging !== i;
          return (
            <div
              key={s.id}
              data-item={i}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragEnter={() => onDragEnter(i)}
              onDragEnd={onDragEnd}
              onDragOver={e => e.preventDefault()}
              onTouchStart={e => onTouchStart(i, e)}
              style={{ transition: 'opacity 0.15s, transform 0.15s, box-shadow 0.15s' }}
              className={[
                'rounded-2xl flex items-center gap-3 px-3 py-2 select-none',
                isDragging
                  ? 'opacity-40 scale-95 border-2 border-dashed border-[#c8f542]/50 bg-zinc-900'
                  : isDropZone
                  ? 'border-2 border-[#c8f542] bg-[#c8f542]/5 shadow-[0_0_0_3px_rgba(200,245,66,0.15)]'
                  : 'bg-zinc-900 border border-zinc-800',
              ].join(' ')}
            >
              <div className={`cursor-grab active:cursor-grabbing px-1 flex-shrink-0 touch-none transition-colors ${dragging !== null ? 'text-[#c8f542]' : 'text-zinc-600'}`}>
                <IconDrag/>
              </div>
              <span className="text-zinc-600 font-bold text-sm w-5 text-center flex-shrink-0">{i+1}</span>
              <input
                type="text"
                value={s.nome}
                onChange={e => renomear(s.id, e.target.value)}
                placeholder="Nome do grupo muscular"
                className="flex-1 bg-transparent text-white font-semibold text-base outline-none placeholder-zinc-700 py-3"
              />
              <button onClick={() => remover(s.id)} className="btn w-11 h-11 rounded-xl flex items-center justify-center text-zinc-700 active:text-red-400 active:bg-zinc-800 flex-shrink-0">
                <IconTrash/>
              </button>
            </div>
          );
        })}
        <button onClick={adicionar} className="btn w-full border border-dashed border-zinc-800 active:border-zinc-600 text-zinc-600 font-semibold py-5 rounded-2xl flex items-center justify-center gap-2">
          <IconPlus/><span className="text-sm">Adicionar grupo</span>
        </button>
      </div>
      <div className="px-5 pb-10 pt-4 border-t border-zinc-900">
        <button onClick={salvar} disabled={saving} className="btn w-full py-5 bg-[#c8f542] active:bg-[#b0d93b] text-black text-base font-bold rounded-2xl disabled:opacity-50">
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </div>
  );
}

export default TelaGerenciarSplits;