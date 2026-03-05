import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { IconDumbbell, IconSettings, IconCardio, IconTrophy, IconChevronRight } from '../components/icons';
import { Spinner } from '../components/ui';

// ─── TELA GRUPAMENTOS ─────────────────────────────────────────────────────────
function TelaGrupamentos({ usuario, splits, loadingSplits, onSelecionarSplit, onGerenciar, onRank, onCardio, onLogout }) {
  const dias = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <div className="px-5 pt-14 pb-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[#c8f542] text-xs font-semibold uppercase tracking-widest">
            {dias[new Date().getDay()]} · {new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}
          </span>
          <button onClick={onLogout} className="btn px-5 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 text-sm font-semibold active:bg-zinc-800">
            Sair
          </button>
        </div>
        <h1 className="text-3xl font-black text-white leading-snug">
          Qual treino de hoje,{' '}
          <span className="text-[#c8f542]">{usuario.nome.split(' ')[0]}</span>?
        </h1>
      </div>
      <div className="px-5 flex flex-col gap-3 pb-10 flex-1">
        {loadingSplits ? <Spinner/> : (
          <>
            {splits.length === 0 && (
              <div className="text-center py-16">
                <p className="text-zinc-500 text-sm mb-4">Nenhum grupo muscular configurado.</p>
                <button onClick={onGerenciar} className="btn px-6 py-4 bg-[#c8f542] text-black font-bold rounded-2xl">Configurar grupos</button>
              </div>
            )}
            {splits.map(split => (
              <button key={split.id} onClick={() => onSelecionarSplit(split)}
                className="btn w-full bg-zinc-900 border border-zinc-800 active:border-zinc-600 active:bg-zinc-800 rounded-2xl p-5 text-left flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 flex-shrink-0"><IconDumbbell/></div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-lg truncate">{split.nome}</div>
                  <div className="text-zinc-500 text-sm mt-0.5">
                    {split.ultimo_treino ? `Último: ${split.ultimo_treino}` : 'Nenhum treino registrado'}
                  </div>
                </div>
                <div className="text-zinc-600"><IconChevronRight/></div>
              </button>
            ))}
            <div className="grid grid-cols-2 gap-3 mt-1">
              <button onClick={onCardio}
                className="btn bg-[#f97316]/8 border border-[#f97316]/25 active:bg-[#f97316]/15 rounded-2xl p-4 flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-[#f97316]/15 flex items-center justify-center text-[#f97316]">
                  <IconCardio/>
                </div>
                <span className="text-[#f97316] text-xs font-semibold text-center leading-tight">Cardio<br/>& Calorias</span>
              </button>
              <button onClick={onGerenciar}
                className="btn bg-zinc-900 border border-zinc-800 active:bg-zinc-800 rounded-2xl p-4 flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400">
                  <IconSettings/>
                </div>
                <span className="text-zinc-400 text-xs font-semibold text-center leading-tight">Gerenciar<br/>grupos musculares</span>
              </button>
              <button onClick={onRank}
                className="btn col-span-2 bg-[#c8f542]/8 border border-[#c8f542]/25 active:bg-[#c8f542]/15 rounded-2xl p-4 flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#c8f542]/15 flex items-center justify-center text-[#c8f542]">
                  <IconTrophy/>
                </div>
                <span className="text-[#c8f542] text-sm font-semibold">Ranking com amigos</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── ÍCONE DRAG HANDLE ───────────────────────────────────────────────────────
export default TelaGrupamentos;