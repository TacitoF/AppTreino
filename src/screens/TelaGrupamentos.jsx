import React from 'react';
import { IconDumbbell, IconSettings, IconCardio, IconTrophy, IconChevronRight } from '../components/icons';
import { Spinner } from '../components/ui';

function TelaGrupamentos({ usuario, splits, loadingSplits, onSelecionarSplit, onGerenciar, onRank, onCardio, onDieta, onLogout, onPerfil }) {
  const dias = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <div className="px-5 pt-14 pb-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[#c8f542] text-xs font-semibold uppercase tracking-widest">
            {dias[new Date().getDay()]} · {new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}
          </span>
          <div className="flex items-center gap-2">
            {/* NOVO: BOTÃO DE PERFIL */}
            <button onClick={onPerfil} className="btn w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 active:bg-zinc-800">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </button>
            <button onClick={onLogout} className="btn px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 text-sm font-semibold active:bg-zinc-800">
              Sair
            </button>
          </div>
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
              <button onClick={onDieta}
                className="btn bg-blue-500/10 border border-blue-500/25 active:bg-blue-500/20 rounded-2xl p-4 flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"/></svg>
                </div>
                <span className="text-blue-500 text-xs font-semibold text-center leading-tight">Dieta<br/>& Macros</span>
              </button>

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
                <span className="text-zinc-400 text-xs font-semibold text-center leading-tight">Gerenciar<br/>grupos</span>
              </button>
              
              <button onClick={onRank}
                className="btn bg-[#c8f542]/8 border border-[#c8f542]/25 active:bg-[#c8f542]/15 rounded-2xl p-4 flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-[#c8f542]/15 flex items-center justify-center text-[#c8f542]">
                  <IconTrophy/>
                </div>
                <span className="text-[#c8f542] text-xs font-semibold text-center leading-tight">Ranking<br/>com amigos</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default TelaGrupamentos;