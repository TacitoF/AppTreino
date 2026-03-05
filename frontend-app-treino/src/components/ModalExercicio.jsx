import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { IconBack, IconPlus } from './icons';
import { EXERCICIOS_DB } from '../data/exercicios';

export const ModalExercicio = memo(({ onSelecionar, onFechar }) => {
  const [regiao, setRegiao]   = useState(null);    
  const [musculo, setMusculo] = useState(null);    
  const [busca, setBusca]     = useState('');

  // EXERCICIOS_DB importado do módulo de dados
  const db = EXERCICIOS_DB;

  const exerciciosFiltrados = useMemo(() => {
    if (!regiao || !musculo) return [];
    const lista = db[regiao].musculos[musculo]?.exercicios || [];
    if (!busca.trim()) return lista;
    return lista.filter(e => e.toLowerCase().includes(busca.toLowerCase()));
  }, [regiao, musculo, busca]);

  const voltar = () => {
    if (musculo) { setMusculo(null); setBusca(''); }
    else setRegiao(null);
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[#0a0a0a]" style={{paddingTop:'env(safe-area-inset-top)'}}>

      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-zinc-900">
        <button onClick={regiao ? voltar : onFechar}
          className="btn w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:bg-zinc-800 flex-shrink-0">
          <IconBack/>
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-black text-lg leading-none">
            {!regiao ? 'Escolher exercício' : !musculo ? db[regiao].label : db[regiao].musculos[musculo].label}
          </h2>
          {regiao && (
            <p className="text-zinc-600 text-xs mt-0.5">
              {!musculo ? 'Selecione o músculo' : 'Toque para adicionar'}
            </p>
          )}
        </div>
        {regiao && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={() => { setRegiao(null); setMusculo(null); setBusca(''); }}
              className="bg-zinc-800 text-zinc-400 text-xs font-semibold px-2.5 py-1.5 rounded-lg">
              {db[regiao].label}
            </button>
            {musculo && (
              <>
                <span className="text-zinc-700 text-xs">›</span>
                <span className="text-[#c8f542] text-xs font-semibold px-2.5 py-1.5 bg-[#c8f542]/10 rounded-lg">
                  {db[regiao].musculos[musculo].label}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* TELA 1 — escolha da região com os novos bonecos minimalistas */}
      {!regiao && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
          <div className="text-center">
            <p className="text-white font-bold text-base">Qual região você vai treinar?</p>
            <p className="text-zinc-500 text-sm mt-1">Selecione para ver os músculos</p>
          </div>

          <div className="flex gap-4 w-full">
            {/* Card Superior */}
            <button onClick={() => setRegiao('superior')}
              className="btn flex-1 bg-zinc-900 border-2 border-zinc-800 active:border-[#c8f542] active:bg-[#c8f542]/5 rounded-3xl p-5 flex flex-col items-center gap-3 active:scale-95 transition-all">
              <svg viewBox="0 0 60 90" fill="none" className="w-20 h-28">
                <rect x="22" y="53" width="7" height="32" rx="3.5" fill="#3f3f46" />
                <rect x="31" y="53" width="7" height="32" rx="3.5" fill="#3f3f46" />
                <circle cx="30" cy="12" r="7" fill="#3f3f46" />
                <rect x="20" y="21" width="20" height="30" rx="2" fill="#c8f542" />
                <rect x="10" y="21" width="8" height="28" rx="4" fill="#c8f542" />
                <rect x="42" y="21" width="8" height="28" rx="4" fill="#c8f542" />
              </svg>
              <div className="text-center">
                <div className="text-white font-black text-sm">Superior</div>
                <div className="text-zinc-600 text-xs mt-0.5">Peito · Costas · Ombro<br/>Braços · Abdômen</div>
              </div>
            </button>

            {/* Card Inferior */}
            <button onClick={() => setRegiao('inferior')}
              className="btn flex-1 bg-zinc-900 border-2 border-zinc-800 active:border-[#c8f542] active:bg-[#c8f542]/5 rounded-3xl p-5 flex flex-col items-center gap-3 active:scale-95 transition-all">
              <svg viewBox="0 0 60 90" fill="none" className="w-20 h-28">
                <circle cx="30" cy="12" r="7" fill="#3f3f46" />
                <rect x="20" y="21" width="20" height="30" rx="2" fill="#3f3f46" />
                <rect x="10" y="21" width="8" height="28" rx="4" fill="#3f3f46" />
                <rect x="42" y="21" width="8" height="28" rx="4" fill="#3f3f46" />
                <rect x="22" y="53" width="7" height="32" rx="3.5" fill="#c8f542" />
                <rect x="31" y="53" width="7" height="32" rx="3.5" fill="#c8f542" />
              </svg>
              <div className="text-center">
                <div className="text-white font-black text-sm">Inferior</div>
                <div className="text-zinc-600 text-xs mt-0.5">Quadríceps · Posterior<br/>Glúteo · Panturrilha</div>
              </div>
            </button>
          </div>

          <button onClick={() => onSelecionar('')}
            className="btn w-full py-4 border border-dashed border-zinc-700 text-zinc-500 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 active:border-zinc-500 active:text-zinc-300">
            <IconPlus/> Digitar nome manualmente
          </button>
        </div>
      )}

      {/* TELA 2 — grid de músculos */}
      {regiao && !musculo && (
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(db[regiao].musculos).map(([key, m]) => (
              <button key={key} onClick={() => setMusculo(key)}
                className="btn bg-zinc-900 border border-zinc-800 active:border-zinc-600 rounded-2xl p-4 flex flex-col items-center gap-3 active:scale-95 transition-transform">
                <div className="w-full h-20 rounded-xl flex items-center justify-center"
                  style={{ color: m.cor, background: m.cor + '18' }}>
                  <m.Svg/>
                </div>
                <span className="text-white font-bold text-sm">{m.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TELA 3 — lista de exercícios do músculo */}
      {regiao && musculo && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 pt-3 pb-3 flex gap-3 items-center border-b border-zinc-900">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ color: db[regiao].musculos[musculo].cor, background: db[regiao].musculos[musculo].cor + '18' }}>
              {(() => { const S = db[regiao].musculos[musculo].Svg; return <S/>; })()}
            </div>
            <input
              type="text"
              placeholder="Buscar exercício..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="flex-1 bg-zinc-900 text-white px-4 py-3 rounded-2xl border border-zinc-800 outline-none focus:border-[#c8f542] transition-colors text-sm placeholder-zinc-600"
            />
          </div>

          <div className="flex-1 overflow-y-auto px-4 pt-3 pb-6 flex flex-col gap-2">
            {exerciciosFiltrados.length === 0 ? (
              <div className="text-center py-10 text-zinc-600 text-sm">Nenhum exercício encontrado.</div>
            ) : exerciciosFiltrados.map(nome => (
              <button key={nome} onClick={() => onSelecionar(nome)}
                className="btn w-full bg-zinc-900 border border-zinc-800 active:border-[#c8f542] active:bg-[#c8f542]/5 rounded-2xl px-4 py-4 text-left flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ color: db[regiao].musculos[musculo].cor, background: db[regiao].musculos[musculo].cor + '20' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 5v14M18 5v14M3 8h3M3 16h3M18 8h3M18 16h3M6 9h12M6 15h12"/>
                  </svg>
                </div>
                <span className="text-white font-semibold text-sm flex-1">{nome}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-zinc-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
              </button>
            ))}

            <button onClick={() => onSelecionar(busca.trim() || '')}
              className="btn w-full border border-dashed border-zinc-800 active:border-zinc-600 text-zinc-500 rounded-2xl px-4 py-4 text-left flex items-center gap-3 mt-1">
              <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 text-zinc-400">
                <IconPlus/>
              </div>
              <span className="text-zinc-400 font-semibold text-sm">
                {busca.trim() ? `Adicionar "${busca.trim()}"` : 'Adicionar nome personalizado'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
});