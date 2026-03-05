import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { IconTrophy } from '../components/icons';

// ─── TELA RESUMO ──────────────────────────────────────────────────────────────
function TelaResumo({ resultado, onVoltar }) {
  const { exercicios, split } = resultado;
  const { totalS, vol } = useMemo(() => ({
    totalS: exercicios.reduce((a,ex)=>a+ex.series.filter(s=>s.enviada).length, 0),
    vol:    exercicios.reduce((a,ex)=>a+ex.series.filter(s=>s.enviada).reduce((b,s)=>b+s.carga*s.reps,0), 0),
  }), [exercicios]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center px-5 pb-10 pt-16 slide-up">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-3xl bg-[#c8f542]/10 border border-[#c8f542]/20 flex items-center justify-center mx-auto mb-5 text-[#c8f542]"><IconTrophy/></div>
          <h1 className="text-3xl font-black text-white">Treino concluído</h1>
          <p className="text-zinc-500 mt-1 font-medium">{split.nome}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[{l:'Séries',v:totalS},{l:'Volume total',v:`${Math.round(vol)} kg`}].map(x=>(
            <div key={x.l} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
              <div className="text-white font-black text-xl num">{x.v}</div>
              <div className="text-zinc-600 text-xs font-medium mt-1">{x.l}</div>
            </div>
          ))}
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6">
          {exercicios.filter(ex=>ex.series.some(s=>s.enviada)).map(ex=>(
            <div key={ex.id} className="mb-4 last:mb-0">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-white font-bold text-sm">{ex.nome||'Exercício'}</p>
                {ex.usaPlacas && (
                  <span className="text-blue-400 text-xs font-semibold bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-lg">
                    Placas
                  </span>
                )}
              </div>
              {ex.series.filter(s=>s.enviada).map(s=>(
                <div key={s.id} className="flex justify-between text-sm py-0.5">
                  <span className="text-zinc-600">Série {s.id}</span>
                  <span className="text-zinc-400 font-medium">
                    {s.carga}{ex.usaPlacas ? ' pl' : 'kg'} × {s.reps} reps
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <button onClick={onVoltar} className="btn w-full py-5 bg-[#c8f542] active:bg-[#b0d93b] text-black font-bold text-base rounded-2xl">
          Voltar ao início
        </button>
      </div>
    </div>
  );
}

export default TelaResumo;