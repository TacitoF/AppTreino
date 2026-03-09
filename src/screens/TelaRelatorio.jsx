import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../auth';
import { R } from '../config';
import { IconBack } from '../components/icons';
import { Spinner } from '../components/ui';

const IconFire = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 23a7.5 7.5 0 01-5.138-12.963C8.204 8.774 11.5 6.5 11 1.5c6 4 9 8 3 14 1 0 2.5 0 3-1.5.5 1.5.5 3-.5 4.5A7.5 7.5 0 0112 23z"/>
  </svg>
);
const IconTrophy2 = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8m-4-4v4M5 3H3a2 2 0 000 4c0 2.21 1.343 4.124 3.273 5.12M19 3h2a2 2 0 010 4c0 2.21-1.343 4.124-3.273 5.12M12 17c-3.866 0-7-3.134-7-7V3h14v7c0 3.866-3.134 7-7 7z"/>
  </svg>
);
const IconUp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
  </svg>
);
const IconDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"/>
  </svg>
);
const IconPR = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
  </svg>
);

function msgStreak(semanas, totalTreinos) {
  if (semanas >= 8) return 'Maquina. 8+ semanas sem parar.';
  if (semanas >= 4) return 'Incrivel consistencia. 4+ semanas.';
  if (semanas >= 2) return 'Duas semanas seguidas. Mantem!';
  if (semanas === 1) return 'Semana ativa. Bora pela proxima!';
  if (totalTreinos > 0) return 'Retome sua sequencia essa semana.';
  return 'Registre seu primeiro treino!';
}

export default function TelaRelatorio({ usuario, onVoltar, mostrarToast }) {
  const [dados, setDados]     = useState(null);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiFetch(R.relatorio + '?id_usuario=' + usuario.id);
      setDados(r);
    } catch {
      mostrarToast('Erro ao carregar relatorio.', 'erro');
    } finally {
      setLoading(false);
    }
  }, [usuario.id, mostrarToast]);

  useEffect(() => { carregar(); }, [carregar]);

  const semanaAtual = dados ? dados.ultimas_4_semanas[0] : null;
  const semanaAnt   = dados ? dados.ultimas_4_semanas[1] : null;
  const diffDias = (semanaAtual && semanaAnt) ? semanaAtual.dias_treino - semanaAnt.dias_treino : null;
  const diffVol  = (semanaAtual && semanaAnt) ? semanaAtual.volume - semanaAnt.volume : null;
  const barMax   = dados ? Math.max.apply(null, dados.ultimas_4_semanas.map(function(s) { return s.volume; }).concat([1])) : 1;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <div className="sticky top-0 z-20 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-zinc-900 px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={onVoltar}
          className="btn w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:bg-zinc-800 flex-shrink-0">
          <IconBack/>
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">Relatorio Semanal</h1>
          {!loading && semanaAtual && (
            <p className="text-zinc-500 text-xs mt-0.5">{semanaAtual.semana_label}</p>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center"><Spinner/></div>
      )}

      {!loading && dados && (
        <div className="px-5 pt-5 pb-16 flex flex-col gap-5">

          {/* Streak */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Sequencia</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-4xl font-black text-[#c8f542]">
                  {dados.streak_semanas > 0 ? dados.streak_semanas : '--'}
                </div>
                <div className="text-zinc-500 text-xs mt-1 font-medium">
                  {dados.streak_semanas === 1 ? 'semana' : 'semanas'} seguidas
                </div>
              </div>
              <div className="text-center border-x border-zinc-800">
                <div className="text-4xl font-black text-white">
                  {dados.streak_dias > 0 ? dados.streak_dias : '--'}
                </div>
                <div className="text-zinc-500 text-xs mt-1 font-medium">
                  {dados.streak_dias === 1 ? 'dia' : 'dias'} consecutivos
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black text-white">
                  {dados.total_treinos_historico}
                </div>
                <div className="text-zinc-500 text-xs mt-1 font-medium">treinos totais</div>
              </div>
            </div>
            <div className="mt-4 bg-[#c8f542]/5 border border-[#c8f542]/15 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="text-[#c8f542] flex-shrink-0"><IconFire/></div>
              <p className="text-[#c8f542] text-sm font-semibold">
                {msgStreak(dados.streak_semanas, dados.total_treinos_historico)}
              </p>
            </div>
          </div>

          {/* Esta semana */}
          {semanaAtual && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Esta semana</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-zinc-800 rounded-xl p-4 text-center">
                  <div className="text-white font-black text-2xl">{semanaAtual.dias_treino}</div>
                  <div className="text-zinc-500 text-xs mt-0.5">dias treinados</div>
                  {diffDias !== null && diffDias !== 0 && (
                    <div className={
                      'flex items-center justify-center gap-1 text-xs font-semibold mt-1.5 ' +
                      (diffDias > 0 ? 'text-[#c8f542]' : 'text-red-400')
                    }>
                      {diffDias > 0 ? <IconUp/> : <IconDown/>}
                      {diffDias > 0 ? '+' : ''}{diffDias} vs ant.
                    </div>
                  )}
                </div>
                <div className="bg-zinc-800 rounded-xl p-4 text-center">
                  <div className="text-white font-black text-2xl">{semanaAtual.volume.toLocaleString('pt-BR')}</div>
                  <div className="text-zinc-500 text-xs mt-0.5">kg volume total</div>
                  {diffVol !== null && diffVol !== 0 && (
                    <div className={
                      'flex items-center justify-center gap-1 text-xs font-semibold mt-1.5 ' +
                      (diffVol > 0 ? 'text-[#c8f542]' : 'text-red-400')
                    }>
                      {diffVol > 0 ? <IconUp/> : <IconDown/>}
                      {diffVol > 0 ? '+' : ''}{Math.round(diffVol)} kg
                    </div>
                  )}
                </div>
              </div>
              {semanaAtual.splits.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {semanaAtual.splits.map(function(s) {
                    return (
                      <span key={s} className="text-zinc-400 text-xs bg-zinc-800 px-3 py-1.5 rounded-xl font-semibold">{s}</span>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* PRs da semana */}
          {dados.prs_semana && dados.prs_semana.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="text-[#c8f542]"><IconTrophy2/></div>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Recordes essa semana</p>
              </div>
              <div className="flex flex-col">
                {dados.prs_semana.map(function(pr, i) {
                  return (
                    <div key={i} className="flex items-center justify-between py-2.5 border-b border-zinc-800 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="text-[#c8f542]"><IconPR/></div>
                        <span className="text-white text-sm font-medium">{pr.exercicio}</span>
                      </div>
                      <span className="text-[#c8f542] font-black text-sm">{pr.carga} kg</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Volume ultimas 4 semanas */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-5">Volume por semana</p>
            <div className="flex items-end gap-3" style={{ height: '112px' }}>
              {[...dados.ultimas_4_semanas].reverse().map(function(s, i, arr) {
                var isLast = i === arr.length - 1;
                var pct = barMax > 0 ? (s.volume / barMax) * 100 : 0;
                var barH = s.volume > 0 ? Math.max(pct, 4) : 0;
                var volLabel = s.volume > 0
                  ? (s.volume >= 1000 ? (Math.round(s.volume / 100) / 10) + 'k' : String(s.volume))
                  : '--';
                var dataLabel = s.semana_label ? s.semana_label.substring(0, 5) : '';
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="text-zinc-600 text-xs font-bold">{volLabel}</div>
                    <div className="w-full flex items-end" style={{ height: '60px' }}>
                      <div
                        className={isLast ? "w-full rounded-t-lg bg-[#c8f542]" : "w-full rounded-t-lg bg-zinc-700"}
                        style={{ height: barH + '%' }}
                      />
                    </div>
                    <div className="text-zinc-600 text-xs text-center w-full truncate">{dataLabel}</div>
                    {s.dias_treino > 0 && (
                      <div className="text-zinc-700 text-xs">{s.dias_treino}d</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}