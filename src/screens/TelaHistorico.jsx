import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../auth';
import { R } from '../config';
import { IconBack } from '../components/icons';
import { Spinner } from '../components/ui';

const IconExport = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
  </svg>
);
const IconNote = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
  </svg>
);

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
  const [comparando, setComparando] = useState(null);
  const [notas, setNotas]           = useState({}); // id_treino → nota
  const [exportando, setExportando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [r, n] = await Promise.all([
        apiFetch(`${R.historicoTodos}?id_usuario=${usuario.id}`),
        apiFetch(`${R.notaTreino}?id_usuario=${usuario.id}`).catch(() => ({ notas: [] })),
      ]);
      setTreinos(agruparTreinos(r.series || []));
      const mapaNotas = {};
      (n.notas || []).forEach(nota => { mapaNotas[nota.id_treino] = nota.nota; });
      setNotas(mapaNotas);
    } catch {
      mostrarToast('Erro ao carregar histórico.', 'erro');
    } finally {
      setLoading(false);
    }
  }, [usuario.id, mostrarToast]);

  const exportarCSV = useCallback(async () => {
    setExportando(true);
    try {
      const r = await apiFetch(`${R.exportarHistorico}?id_usuario=${usuario.id}`);
      const rows = r.registros || [];
      if (rows.length === 0) { mostrarToast('Nenhum dado para exportar.', 'info'); return; }
      const header = 'Data,Exercicio,Serie,Carga (kg),Repeticoes,Volume (kg)';
      const csv = [header, ...rows.map(r =>
        `${r.data},"${r.exercicio}",${r.serie},${r.carga_kg},${r.repeticoes},${r.volume}`
      )].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `volt_historico_${usuario.id}.csv`; a.click();
      URL.revokeObjectURL(url);
      mostrarToast('Histórico exportado.', 'sucesso');
    } catch { mostrarToast('Erro ao exportar.', 'erro'); }
    finally { setExportando(false); }
  }, [usuario.id, mostrarToast]);

  useEffect(() => { carregar(); }, [carregar]);

  const splitNames = ['todos', ...Array.from(new Set(treinos.map(t => t.split)))];

  const treinosFiltrados = filtroSplit === 'todos'
    ? treinos
    : treinos.filter(t => t.split === filtroSplit);

  // ── comparativo de treinos ──
  if (comparando && treinoAberto) {
    const a = comparando;   // anterior
    const b = treinoAberto; // atual
    // todos os exercícios únicos entre os dois treinos
    const todosEx = Array.from(new Set([...a.exercicios.map(e=>e.nome), ...b.exercicios.map(e=>e.nome)]));
    const exA = Object.fromEntries(a.exercicios.map(e=>[e.nome,e]));
    const exB = Object.fromEntries(b.exercicios.map(e=>[e.nome,e]));
    const diffVol = Math.round(b.volumeTotal - a.volumeTotal);
    const diffPct = a.volumeTotal > 0 ? ((b.volumeTotal - a.volumeTotal) / a.volumeTotal * 100).toFixed(1) : null;
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        <div className="sticky top-0 z-20 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-zinc-900 px-5 pt-12 pb-4 flex items-center gap-3">
          <button onClick={() => setComparando(null)}
            className="btn w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white active:bg-zinc-800 flex-shrink-0">
            <IconBack/>
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-zinc-500 text-xs font-semibold uppercase tracking-widest">Comparativo</div>
            <div className="text-white font-bold text-base truncate">{b.split}</div>
          </div>
        </div>

        {/* cabeçalhos das datas */}
        <div className="px-5 pt-4 pb-3 grid grid-cols-2 gap-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center">
            <div className="text-zinc-500 text-xs font-semibold uppercase mb-0.5">Anterior</div>
            <div className="text-white font-bold text-sm">{fmtDataCurta(a.data)}</div>
            <div className="text-zinc-600 text-xs mt-0.5">{Math.round(a.volumeTotal)} kg vol.</div>
          </div>
          <div className="bg-zinc-900 border border-[#c8f542]/30 rounded-2xl p-3 text-center">
            <div className="text-[#c8f542] text-xs font-semibold uppercase mb-0.5">Atual</div>
            <div className="text-white font-bold text-sm">{fmtDataCurta(b.data)}</div>
            <div className="text-zinc-600 text-xs mt-0.5">{Math.round(b.volumeTotal)} kg vol.</div>
          </div>
        </div>

        {/* delta de volume */}
        <div className={`mx-5 mb-4 rounded-2xl p-4 flex items-center gap-3 ${diffVol >= 0 ? 'bg-[#c8f542]/8 border border-[#c8f542]/20' : 'bg-red-500/8 border border-red-500/20'}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke={diffVol>=0?"#c8f542":"#ef4444"} strokeWidth={2.5} className="w-5 h-5 flex-shrink-0">
            {diffVol >= 0
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              : <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"/>}
          </svg>
          <div>
            <span className={`font-black text-lg ${diffVol>=0?'text-[#c8f542]':'text-red-400'}`}>
              {diffVol >= 0 ? '+' : ''}{diffVol} kg
            </span>
            {diffPct && <span className="text-zinc-500 text-sm ml-2">({diffVol>=0?'+':''}{diffPct}%)</span>}
            <div className="text-zinc-500 text-xs mt-0.5">variação de volume total</div>
          </div>
        </div>

        {/* exercícios lado a lado */}
        <div className="px-5 pb-10 flex flex-col gap-3">
          {todosEx.map(nome => {
            const ea = exA[nome]; const eb = exB[nome];
            const cargaMaxA = ea ? Math.max(...ea.series.map(s=>s.carga_kg)) : null;
            const cargaMaxB = eb ? Math.max(...eb.series.map(s=>s.carga_kg)) : null;
            const melhorou = cargaMaxA !== null && cargaMaxB !== null && cargaMaxB > cargaMaxA;
            const piorou   = cargaMaxA !== null && cargaMaxB !== null && cargaMaxB < cargaMaxA;
            return (
              <div key={nome} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                  <span className="text-white font-bold text-sm">{nome}</span>
                  {melhorou && <span className="text-[#c8f542] text-xs font-bold bg-[#c8f542]/10 px-2 py-0.5 rounded-lg">↑ PR</span>}
                  {piorou   && <span className="text-red-400 text-xs font-semibold bg-red-500/10 px-2 py-0.5 rounded-lg">↓</span>}
                </div>
                <div className="border-t border-zinc-800 grid grid-cols-2 divide-x divide-zinc-800">
                  {/* coluna anterior */}
                  <div className="p-3">
                    {ea ? ea.series.map((s,i) => (
                      <div key={i} className="text-zinc-500 text-xs py-0.5">{s.carga_kg}kg × {s.repeticoes}</div>
                    )) : <div className="text-zinc-700 text-xs italic">não realizado</div>}
                  </div>
                  {/* coluna atual */}
                  <div className="p-3">
                    {eb ? eb.series.map((s,i) => {
                      const sa = ea?.series[i];
                      const up = sa && (s.carga_kg > sa.carga_kg || (s.carga_kg >= sa.carga_kg && s.repeticoes > sa.repeticoes));
                      return (
                        <div key={i} className={`text-xs py-0.5 font-semibold ${up ? 'text-[#c8f542]' : 'text-zinc-300'}`}>
                          {s.carga_kg}kg × {s.repeticoes}
                        </div>
                      );
                    }) : <div className="text-zinc-700 text-xs italic">não realizado</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }


  // ── detalhe de treino ──
  if (treinoAberto) {
    const t = treinoAberto;
    const treinosDoSplit = treinos.filter(tr => tr.split === t.split && tr.data < t.data);
    const anterior = treinosDoSplit.length > 0 ? treinosDoSplit[0] : null;
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
          <div className="flex items-center gap-2">
            {anterior && (
              <button onClick={() => setComparando(anterior)}
                className="btn flex items-center gap-1.5 px-3 py-2.5 bg-violet-500/10 border border-violet-500/25 rounded-xl text-violet-400 text-xs font-semibold active:bg-violet-500/20">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                Comparar
              </button>
            )}
            {onVerGraficos && (
              <button onClick={() => onVerGraficos(t.split)}
                className="btn flex items-center gap-2 px-3 py-2.5 bg-[#c8f542]/10 border border-[#c8f542]/25 rounded-xl text-[#c8f542] text-xs font-semibold active:bg-[#c8f542]/20">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
                Gráfico
              </button>
            )}
          </div>
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

        {/* nota do treino — se existir */}
        {notas[t.data + '_' + (t.id_treino || '')] || Object.entries(notas).find(([k, v]) => k.includes(t.data.replace(/-/g, ''))) ? (() => {
          const notaEntry = Object.entries(notas).find(([k]) => k.includes(t.data.replace(/-/g, '')));
          if (!notaEntry) return null;
          return (
            <div className="px-5 pb-3">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 flex items-start gap-3">
                <div className="text-zinc-500 flex-shrink-0 mt-0.5"><IconNote/></div>
                <p className="text-zinc-400 text-sm leading-relaxed">{notaEntry[1]}</p>
              </div>
            </div>
          );
        })() : null}

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
        <div className="flex items-center gap-2">
          <button onClick={exportarCSV} disabled={exportando}
            className="btn w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 active:bg-zinc-800 disabled:opacity-50">
            <IconExport/>
          </button>
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