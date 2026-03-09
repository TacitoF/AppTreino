import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../auth';
import { R } from '../config';
import { IconBack } from '../components/icons';
import { Spinner } from '../components/ui';

// ─── helpers ────────────────────────────────────────────────────────────────
const fmtData = iso =>
  new Date(iso + (iso.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  });

const fmtDataCurta = iso =>
  new Date(iso + (iso.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short',
  });

// agrupa séries brutas em treinos [{data, split, exercicios}]
function agruparTreinos(series) {
  const mapaData = new Map();
  series.forEach(s => {
    const chave = `${s.data_treino}__${s.nome_split || 'Treino'}`;
    if (!mapaData.has(chave)) mapaData.set(chave, { data: s.data_treino, split: s.nome_split || 'Treino', series: [] });
    mapaData.get(chave).series.push(s);
  });

  return Array.from(mapaData.values())
    .sort((a, b) => b.data.localeCompare(a.data))
    .map(t => {
      const mapaEx = new Map();
      t.series.forEach(s => {
        const nome = s.nome_exercicio || 'Exercício';
        if (!mapaEx.has(nome)) mapaEx.set(nome, []);
        mapaEx.get(nome).push(s);
      });
      const exercicios = Array.from(mapaEx.entries()).map(([nome, ss]) => ({
        nome: nome.startsWith('[P]') ? nome.slice(3) : nome,
        usaPlacas: nome.startsWith('[P]'),
        series: ss.sort((a, b) => a.numero_serie - b.numero_serie),
        volume: ss.reduce((acc, s) => acc + s.carga_kg * s.repeticoes, 0),
      }));
      const volumeTotal = exercicios.reduce((a, e) => a + e.volume, 0);
      const totalSeries = t.series.length;
      return { ...t, exercicios, volumeTotal, totalSeries };
    });
}

// ─── componente principal ───────────────────────────────────────────────────
function TelaHistorico({ usuario, splits, onVoltar, onVerGraficos, mostrarToast }) {
  const [treinos, setTreinos]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [treinoAberto, setAberto]   = useState(null);
  const [filtroSplit, setFiltro]    = useState('todos');

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiFetch(`${R.historico}?id_usuario=${usuario.id}&todos=1`);
      setTreinos(agruparTreinos(r.series || []));
    } catch {
      mostrarToast('Erro ao carregar histórico.', 'erro');
    } finally {
      setLoading(false);
    }
  }, [usuario.id, mostrarToast]);

  useEffect(() => { carregar(); }, [carregar]);

  const splitNames = ['todos', ...Array.from(new Set(treinos.map(t => t.split)))];

  const treinosFiltrados = filtroSplit === 'todos'
    ? treinos
    : treinos.filter(t => t.split === filtroSplit);

  // ── detalhe de treino ──
  if (treinoAberto) {
    const t = treinoAberto;
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        <div className="sticky top-0 z-20 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-zinc-900 px-5 pt-12 pb-4 flex items-center gap-3">
          <button onClick={() => setAberto(null)}
            className="btn w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:bg-zinc-800 flex-shrink-0">
            <IconBack/>
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-[#c8f542] text-xs font-semibold uppercase tracking-widest">{fmtData(t.data)}</div>
            <div className="text-white font-bold text-lg truncate">{t.split}</div>
          </div>
          {/* botão de gráficos para este split */}
          {onVerGraficos && (
            <button
              onClick={() => onVerGraficos(t.split)}
              className="btn flex items-center gap-2 px-3 py-2.5 bg-[#c8f542]/10 border border-[#c8f542]/25 rounded-xl text-[#c8f542] text-xs font-semibold active:bg-[#c8f542]/20">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              Gráfico
            </button>
          )}
        </div>

        {/* métricas do treino */}
        <div className="px-5 pt-5 pb-3 grid grid-cols-2 gap-3">
          {[
            { l: 'Séries',        v: t.totalSeries },
            { l: 'Volume total',  v: `${Math.round(t.volumeTotal)} kg` },
            { l: 'Exercícios',    v: t.exercicios.length },
            { l: 'Séries/exerc.', v: (t.totalSeries / t.exercicios.length).toFixed(1) },
          ].map(x => (
            <div key={x.l} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
              <div className="text-white font-black text-xl">{x.v}</div>
              <div className="text-zinc-600 text-xs font-medium mt-0.5">{x.l}</div>
            </div>
          ))}
        </div>

        {/* exercícios */}
        <div className="px-5 pb-10 flex flex-col gap-3">
          {t.exercicios.map(ex => (
            <div key={ex.nome} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="px-4 pt-4 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-sm">{ex.nome}</span>
                  {ex.usaPlacas && (
                    <span className="text-blue-400 text-xs font-semibold bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-lg">Placas</span>
                  )}
                </div>
                <span className="text-zinc-500 text-xs font-semibold">{Math.round(ex.volume)} kg vol.</span>
              </div>
              <div className="border-t border-zinc-800 px-4 py-3 flex flex-col gap-1.5">
                {ex.series.map((s, i) => {
                  const vol = s.carga_kg * s.repeticoes;
                  return (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-zinc-600 text-sm w-16">Série {s.numero_serie}</span>
                      <span className="text-white font-bold text-sm">
                        {s.carga_kg}{ex.usaPlacas ? ' pl' : ' kg'} × {s.repeticoes} reps
                      </span>
                      <span className="text-zinc-600 text-xs w-16 text-right">{vol} kg</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── lista de treinos ──
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <div className="sticky top-0 z-20 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-zinc-900 px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={onVoltar}
          className="btn w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:bg-zinc-800 flex-shrink-0">
          <IconBack/>
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">Histórico</h1>
          {!loading && <p className="text-zinc-500 text-xs mt-0.5">{treinos.length} treino{treinos.length !== 1 ? 's' : ''} registrado{treinos.length !== 1 ? 's' : ''}</p>}
        </div>
        {onVerGraficos && (
          <button
            onClick={() => onVerGraficos(null)}
            className="btn flex items-center gap-2 px-3 py-2.5 bg-[#c8f542]/10 border border-[#c8f542]/25 rounded-xl text-[#c8f542] text-xs font-semibold active:bg-[#c8f542]/20">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            Gráficos
          </button>
        )}
      </div>

      {/* filtro por split */}
      {splitNames.length > 2 && (
        <div className="px-5 pt-4 pb-1 flex gap-2 overflow-x-auto no-scrollbar">
          {splitNames.map(s => (
            <button key={s} onClick={() => setFiltro(s)}
              className={`btn flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                filtroSplit === s ? 'bg-[#c8f542] text-black' : 'bg-zinc-900 border border-zinc-800 text-zinc-400'
              }`}>
              {s === 'todos' ? 'Todos' : s}
            </button>
          ))}
        </div>
      )}

      <div className="px-5 pt-4 pb-10 flex flex-col gap-3">
        {loading ? <Spinner/> : treinosFiltrados.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth={2} className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <p className="text-zinc-500 text-sm">Nenhum treino registrado ainda.</p>
            <p className="text-zinc-700 text-xs mt-1">Finalize um treino para ele aparecer aqui.</p>
          </div>
        ) : treinosFiltrados.map((t, i) => (
          <button key={`${t.data}-${t.split}-${i}`} onClick={() => setAberto(t)}
            className="btn w-full bg-zinc-900 border border-zinc-800 active:bg-zinc-800 active:border-zinc-600 rounded-2xl p-4 text-left flex items-center gap-4 transition-all">
            {/* data */}
            <div className="w-14 h-14 rounded-xl bg-zinc-800 flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-white font-black text-lg leading-none">
                {new Date(t.data + 'T00:00:00').getDate()}
              </span>
              <span className="text-zinc-500 text-xs font-semibold uppercase">
                {new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' })}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-bold truncate">{t.split}</div>
              <div className="text-zinc-500 text-xs mt-0.5">
                {t.exercicios.length} exerc. · {t.totalSeries} séries
              </div>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {t.exercicios.slice(0, 3).map(ex => (
                  <span key={ex.nome} className="text-zinc-700 text-xs bg-zinc-800 px-2 py-0.5 rounded-lg truncate max-w-[90px]">{ex.nome}</span>
                ))}
                {t.exercicios.length > 3 && (
                  <span className="text-zinc-700 text-xs">+{t.exercicios.length - 3}</span>
                )}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-[#c8f542] font-black text-sm">{Math.round(t.volumeTotal)}</div>
              <div className="text-zinc-700 text-xs">kg vol.</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default TelaHistorico;